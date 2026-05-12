import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import {
  createSlotSettingsFromProbabilities,
  createDefaultSlotSettings,
  normalizeSlotSettings,
  type SlotSettings,
} from '../shared/slotConfig'

const CACHE_KEY = 'sos.slot.settings.v1'

function readCachedSettings(): SlotSettings | null {
  try {
    const storedValue = window.localStorage.getItem(CACHE_KEY)
    return storedValue
      ? normalizeSlotSettings(JSON.parse(storedValue) as Partial<SlotSettings>)
      : null
  } catch {
    return null
  }
}

function cacheSettings(settings: SlotSettings) {
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(settings))
}

export function useSlotSettings() {
  const remoteProbabilities = useQuery(api.leads.getProbabilities)
  const [cachedSettings] = useState<SlotSettings | null>(() =>
    readCachedSettings(),
  )
  const normalizedRemoteSettings = useMemo(
    () =>
      remoteProbabilities === undefined
        ? null
        : normalizeSlotSettings(
            createSlotSettingsFromProbabilities(remoteProbabilities),
          ),
    [remoteProbabilities],
  )

  useEffect(() => {
    if (normalizedRemoteSettings === null) {
      return
    }

    cacheSettings(normalizedRemoteSettings)
  }, [normalizedRemoteSettings])

  if (normalizedRemoteSettings === null) {
    return {
      isLoading: cachedSettings === null,
      isUsingCache: cachedSettings !== null,
      settings: cachedSettings ?? createDefaultSlotSettings(),
    }
  }

  return {
    isLoading: false,
    isUsingCache: false,
    settings: normalizedRemoteSettings,
  }
}
