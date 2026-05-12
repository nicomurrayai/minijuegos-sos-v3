export const SLOT_GAME_ID = 'slotmachine' as const

export const slotPrizeIds = [
  'salud-bienestar',
  'hogar',
  'movilidad',
  'multiasistencia',
] as const

export type SlotPrizeId = (typeof slotPrizeIds)[number]

export type SlotPrizeConfig = {
  color: string
  enabled: boolean
  id: SlotPrizeId
  imageSrc: string
  label: string
  probability: number
}

export type SlotSettings = {
  game: typeof SLOT_GAME_ID
  prizes: SlotPrizeConfig[]
  source: 'default' | 'legacy' | 'remote'
  updatedAt: number
}

export type SlotLeadPayload = {
  createdAt: number
  email: string
  game: typeof SLOT_GAME_ID
  isWinner: boolean
  prize: string | null
  prizeId: SlotPrizeId | null
  prizeLabel: string | null
  symbols: SlotPrizeId[]
}

export type RawSlotPrizeConfig = Partial<Omit<SlotPrizeConfig, 'id'>> & {
  id?: string
}

export type LegacyProbabilityKey =
  | 'sos'
  | 'grua'
  | 'moto'
  | 'moura'
  | 'lusqtoff'

export type SlotProbabilityRecord = Partial<
  Record<LegacyProbabilityKey | SlotPrizeId, number>
>

export const DEFAULT_SLOT_PRIZES: SlotPrizeConfig[] = [
  {
    color: '#ff4d28',
    enabled: true,
    id: 'salud-bienestar',
    imageSrc: '/slot-salud-bienestar.png',
    label: 'Salud y Bienestar',
    probability: 0.05,
  },
  {
    color: '#f2c94c',
    enabled: true,
    id: 'hogar',
    imageSrc: '/slot-hogar.png',
    label: 'Hogar',
    probability: 0.1,
  },
  {
    color: '#4a90e2',
    enabled: true,
    id: 'movilidad',
    imageSrc: '/slot-movilidad.png',
    label: 'Movilidad',
    probability: 0.15,
  },
  {
    color: '#2ab761',
    enabled: true,
    id: 'multiasistencia',
    imageSrc: '/slot-multiasistencia.png',
    label: 'Multiasistencia',
    probability: 0.2,
  },
]

const fallbackPrizeById = new Map(
  DEFAULT_SLOT_PRIZES.map((prize) => [prize.id, prize]),
)

export function createDefaultSlotSettings(): SlotSettings {
  return {
    game: SLOT_GAME_ID,
    prizes: cloneSlotPrizes(DEFAULT_SLOT_PRIZES),
    source: 'default',
    updatedAt: 0,
  }
}

export function cloneSlotPrizes(prizes: SlotPrizeConfig[]): SlotPrizeConfig[] {
  return prizes.map((prize) => ({ ...prize }))
}

export function isSlotPrizeId(value: string): value is SlotPrizeId {
  return slotPrizeIds.some((prizeId) => prizeId === value)
}

export function clampProbability(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(Math.max(value, 0), 1)
}

export function calculateTotalProbability(prizes: SlotPrizeConfig[]): number {
  return prizes.reduce(
    (total, prize) =>
      total + (prize.enabled ? clampProbability(prize.probability) : 0),
    0,
  )
}

export function validateSlotPrizes(prizes: SlotPrizeConfig[]): string | null {
  const seenIds = new Set<SlotPrizeId>()

  for (const prize of prizes) {
    if (!isSlotPrizeId(prize.id)) {
      return `Premio invalido: ${prize.id}`
    }

    if (seenIds.has(prize.id)) {
      return `Premio duplicado: ${prize.label}`
    }

    seenIds.add(prize.id)

    if (prize.label.trim().length < 2) {
      return 'Cada premio necesita un nombre visible.'
    }

    if (prize.probability < 0 || prize.probability > 1) {
      return 'Cada probabilidad debe estar entre 0% y 100%.'
    }
  }

  const total = calculateTotalProbability(prizes)

  if (total > 1) {
    return `La suma de probabilidades (${(total * 100).toFixed(1)}%) no puede superar 100%.`
  }

  return null
}

export function normalizeSlotPrizes(
  prizes: RawSlotPrizeConfig[] | null | undefined,
): SlotPrizeConfig[] {
  if (!prizes?.length) {
    return cloneSlotPrizes(DEFAULT_SLOT_PRIZES)
  }

  const byId = new Map<string, RawSlotPrizeConfig>(
    prizes.map((prize) => [String(prize.id), prize]),
  )

  return DEFAULT_SLOT_PRIZES.map((fallback) => {
    const incoming = byId.get(fallback.id)

    return {
      color: incoming?.color || fallback.color,
      enabled: incoming?.enabled ?? fallback.enabled,
      id: fallback.id,
      imageSrc: incoming?.imageSrc || fallback.imageSrc,
      label: incoming?.label?.trim() || fallback.label,
      probability: clampProbability(
        typeof incoming?.probability === 'number'
          ? incoming.probability
          : fallback.probability,
      ),
    }
  })
}

export function normalizeSlotSettings(
  value: Partial<SlotSettings> | null | undefined,
): SlotSettings {
  if (!value) {
    return createDefaultSlotSettings()
  }

  return {
    game: SLOT_GAME_ID,
    prizes: normalizeSlotPrizes(value.prizes),
    source: value.source ?? 'remote',
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
  }
}

export function normalizeSlotPrizesFromProbabilities(
  probabilities: SlotProbabilityRecord | null | undefined,
): SlotPrizeConfig[] {
  return normalizeSlotPrizes([
    {
      id: 'salud-bienestar',
      probability: probabilities?.['salud-bienestar'] ?? probabilities?.sos,
    },
    {
      id: 'hogar',
      probability: probabilities?.hogar ?? probabilities?.grua,
    },
    {
      id: 'movilidad',
      probability: probabilities?.movilidad ?? probabilities?.moto,
    },
    {
      id: 'multiasistencia',
      probability: probabilities?.multiasistencia ?? probabilities?.moura,
    },
  ])
}

export function createSlotSettingsFromProbabilities(
  probabilities: SlotProbabilityRecord | null | undefined,
  source: SlotSettings['source'] = 'remote',
  updatedAt = 0,
): SlotSettings {
  return {
    game: SLOT_GAME_ID,
    prizes: normalizeSlotPrizesFromProbabilities(probabilities),
    source,
    updatedAt,
  }
}

export function createLegacyProbabilityPayload(
  prizes: SlotPrizeConfig[],
  preservedProbabilities?: SlotProbabilityRecord | null,
): Record<LegacyProbabilityKey, number> {
  const normalizedPrizes = normalizeSlotPrizes(prizes)
  const probabilityFor = (prizeId: SlotPrizeId) => {
    const prize = getPrizeById(normalizedPrizes, prizeId)
    return prize.enabled ? prize.probability : 0
  }

  return {
    grua: probabilityFor('hogar'),
    lusqtoff: preservedProbabilities?.lusqtoff ?? 0,
    moto: probabilityFor('movilidad'),
    moura: probabilityFor('multiasistencia'),
    sos: probabilityFor('salud-bienestar'),
  }
}

export function getPrizeById(
  prizes: SlotPrizeConfig[],
  prizeId: SlotPrizeId,
): SlotPrizeConfig {
  return (
    prizes.find((prize) => prize.id === prizeId) ??
    fallbackPrizeById.get(prizeId) ??
    DEFAULT_SLOT_PRIZES[0]
  )
}

export function pickWeightedPrize(
  prizes: SlotPrizeConfig[],
  randomValue = Math.random(),
): SlotPrizeConfig | null {
  const activePrizes = normalizeSlotPrizes(prizes).filter(
    (prize) => prize.enabled && prize.probability > 0,
  )
  let cumulativeProbability = 0

  for (const prize of activePrizes) {
    cumulativeProbability += clampProbability(prize.probability)

    if (randomValue < cumulativeProbability) {
      return prize
    }
  }

  return null
}

export function createLosingSymbolIds(
  prizes: SlotPrizeConfig[],
  reelCount: number,
): SlotPrizeId[] {
  const activePrizes = normalizeSlotPrizes(prizes).filter(
    (prize) => prize.enabled,
  )
  const sourcePrizes = activePrizes.length > 1 ? activePrizes : DEFAULT_SLOT_PRIZES
  const symbolIds = Array.from({ length: reelCount }, () => {
    const index = Math.floor(Math.random() * sourcePrizes.length)
    return sourcePrizes[index].id
  })

  if (symbolIds.every((symbolId) => symbolId === symbolIds[0])) {
    const replacement = sourcePrizes.find(
      (prize) => prize.id !== symbolIds[0],
    ) ?? DEFAULT_SLOT_PRIZES.find((prize) => prize.id !== symbolIds[0])

    if (replacement) {
      symbolIds[reelCount - 1] = replacement.id
    }
  }

  return symbolIds
}
