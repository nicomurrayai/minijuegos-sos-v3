import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import {
  SLOT_DISABLED_EMAIL_FALLBACK,
  SLOT_GAME_ID,
  calculateTotalProbability,
  normalizeSlotPrizes,
  validateSlotPrizes,
  type SlotPrizeConfig,
} from '../src/shared/slotConfig'

const slotPrizeValidator = v.object({
  color: v.string(),
  enabled: v.boolean(),
  id: v.string(),
  imageSrc: v.string(),
  label: v.string(),
  probability: v.number(),
})

function assertEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail === SLOT_DISABLED_EMAIL_FALLBACK) {
    return SLOT_DISABLED_EMAIL_FALLBACK
  }

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)

  if (!isValid) {
    throw new Error('Email invalido')
  }

  return normalizedEmail
}

function getProbabilityById(
  prizes: SlotPrizeConfig[],
  id: SlotPrizeConfig['id'],
) {
  return prizes.find((prize) => prize.id === id)?.probability ?? 0
}

export const createLead = mutation({
  args: {
    createdAt: v.optional(v.number()),
    email: v.string(),
    game: v.optional(v.string()),
    isWinner: v.boolean(),
    prize: v.union(v.string(), v.null()),
    prizeId: v.optional(v.union(v.string(), v.null())),
    prizeLabel: v.optional(v.union(v.string(), v.null())),
    symbols: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const email = assertEmail(args.email)
    const prizeLabel = args.prizeLabel ?? args.prize

    return await ctx.db.insert('leads', {
      createdAt: args.createdAt ?? Date.now(),
      email,
      game: args.game ?? SLOT_GAME_ID,
      isWinner: args.isWinner,
      prize: prizeLabel,
      prizeId: args.prizeId,
      prizeLabel,
      symbols: args.symbols,
    })
  },
})

export const getAllLeads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('leads').collect()
  },
})

export const getProbabilities = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('probabilities').first()
  },
})

export const getSlotSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query('slotSettings').first()

    if (settings) {
      return {
        game: SLOT_GAME_ID,
        prizes: normalizeSlotPrizes(settings.prizes),
        source: 'remote' as const,
        updatedAt: settings.updatedAt,
      }
    }

    const legacy = await ctx.db.query('probabilities').first()

    if (!legacy) {
      return {
        game: SLOT_GAME_ID,
        prizes: normalizeSlotPrizes(null),
        source: 'remote' as const,
        updatedAt: 0,
      }
    }

    return {
      game: SLOT_GAME_ID,
      prizes: normalizeSlotPrizes([
        {
          id: 'salud-bienestar',
          probability: legacy.saludBienestar ?? legacy.sos,
        },
        { id: 'hogar', probability: legacy.hogar ?? legacy.grua },
        { id: 'movilidad', probability: legacy.movilidad ?? legacy.moto },
        {
          id: 'multiasistencia',
          probability: legacy.multiasistencia ?? legacy.moura,
        },
      ]),
      source: 'legacy' as const,
      updatedAt: legacy._creationTime,
    }
  },
})

export const updateSlotSettings = mutation({
  args: {
    prizes: v.array(slotPrizeValidator),
  },
  handler: async (ctx, args) => {
    const prizes = normalizeSlotPrizes(args.prizes)
    const validationError = validateSlotPrizes(prizes)

    if (validationError) {
      throw new Error(validationError)
    }

    const updatedAt = Date.now()
    const existingSettings = await ctx.db.query('slotSettings').first()

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, { prizes, updatedAt })
    } else {
      await ctx.db.insert('slotSettings', {
        game: SLOT_GAME_ID,
        prizes,
        updatedAt,
      })
    }

    const existingProbabilities = await ctx.db.query('probabilities').first()
    const probabilityPatch = {
      hogar: getProbabilityById(prizes, 'hogar'),
      movilidad: getProbabilityById(prizes, 'movilidad'),
      multiasistencia: getProbabilityById(prizes, 'multiasistencia'),
      saludBienestar: getProbabilityById(prizes, 'salud-bienestar'),
      sos: getProbabilityById(prizes, 'salud-bienestar'),
    }

    if (existingProbabilities) {
      await ctx.db.patch(existingProbabilities._id, probabilityPatch)
    } else {
      await ctx.db.insert('probabilities', probabilityPatch)
    }

    return { totalProbability: calculateTotalProbability(prizes), updatedAt }
  },
})

export const updateProbability = mutation({
  args: {
    prize: v.union(
      v.literal('saludBienestar'),
      v.literal('hogar'),
      v.literal('movilidad'),
      v.literal('multiasistencia'),
      v.literal('sos'),
      v.literal('grua'),
      v.literal('moto'),
      v.literal('moura'),
      v.literal('lusqtoff'),
    ),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.value < 0 || args.value > 1) {
      throw new Error('La probabilidad debe estar entre 0 y 1')
    }

    const existing = await ctx.db.query('probabilities').first()

    if (existing) {
      await ctx.db.patch(existing._id, { [args.prize]: args.value })
    } else {
      await ctx.db.insert('probabilities', { [args.prize]: args.value })
    }
  },
})

export const updateAllProbabilities = mutation({
  args: {
    grua: v.optional(v.number()),
    hogar: v.optional(v.number()),
    lusqtoff: v.optional(v.number()),
    moto: v.optional(v.number()),
    moura: v.optional(v.number()),
    movilidad: v.optional(v.number()),
    multiasistencia: v.optional(v.number()),
    saludBienestar: v.optional(v.number()),
    sos: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const values = Object.values(args).filter(
      (value): value is number => typeof value === 'number',
    )

    if (values.some((value) => value < 0 || value > 1)) {
      throw new Error('Todas las probabilidades deben estar entre 0 y 1')
    }

    const sum = values.reduce((acc, value) => acc + value, 0)

    if (sum > 1) {
      throw new Error(
        `La suma de probabilidades (${(sum * 100).toFixed(1)}%) no puede superar 100%`,
      )
    }

    const existing = await ctx.db.query('probabilities').first()

    if (existing) {
      await ctx.db.patch(existing._id, args)
    } else {
      await ctx.db.insert('probabilities', args)
    }
  },
})
