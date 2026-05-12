import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  leads: defineTable({
    createdAt: v.optional(v.number()),
    email: v.string(),
    game: v.optional(v.string()),
    isWinner: v.optional(v.boolean()),
    prize: v.optional(v.union(v.string(), v.null())),
    prizeId: v.optional(v.union(v.string(), v.null())),
    prizeLabel: v.optional(v.union(v.string(), v.null())),
    symbols: v.optional(v.array(v.string())),
  }),
  probabilities: defineTable({
    grua: v.optional(v.number()),
    hogar: v.optional(v.number()),
    lusqtoff: v.optional(v.number()),
    moto: v.optional(v.number()),
    moura: v.optional(v.number()),
    movilidad: v.optional(v.number()),
    multiasistencia: v.optional(v.number()),
    saludBienestar: v.optional(v.number()),
    sos: v.optional(v.number()),
  }),
  slotSettings: defineTable({
    game: v.string(),
    prizes: v.array(
      v.object({
        color: v.string(),
        enabled: v.boolean(),
        id: v.string(),
        imageSrc: v.string(),
        label: v.string(),
        probability: v.number(),
      }),
    ),
    updatedAt: v.number(),
  }),
})
