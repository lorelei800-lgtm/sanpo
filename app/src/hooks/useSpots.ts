import { useCallback, useEffect, useState } from 'react'
import type { Spot } from '../types'
import { fetchSpots } from '../services/cmsApi'
import { MOCK_SPOTS } from '../data/mockSpots'
import { CMS } from '../config'

/**
 * Merges CMS-fetched spots with mock seed spots.
 * - If CMS is disabled, just returns mock spots.
 * - If CMS is enabled but returns no items, falls back to mock spots so the map never looks empty.
 * - Local (not-yet-persisted) posts are appended via addLocal().
 */
export function useSpots() {
  const [remoteSpots, setRemoteSpots] = useState<Spot[]>([])
  const [localSpots, setLocalSpots]   = useState<Spot[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [usingMock, setUsingMock]     = useState(false)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    if (!CMS.enabled) {
      setRemoteSpots([])
      setUsingMock(true)
      setIsLoading(false)
      return
    }
    const data = await fetchSpots()
    if (data.length === 0) {
      setRemoteSpots([])
      setUsingMock(true)
    } else {
      setRemoteSpots(data)
      setUsingMock(false)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const addLocal = useCallback((spot: Spot) => {
    setLocalSpots(prev => [spot, ...prev])
  }, [])

  const baseSpots = usingMock ? MOCK_SPOTS : remoteSpots
  const spots = [...localSpots, ...baseSpots]

  return { spots, isLoading, refresh, addLocal, usingMock }
}
