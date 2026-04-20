import { useCallback, useEffect, useState } from 'react'
import type { Spot } from '../types'
import { fetchSpots } from '../services/cmsApi'

/**
 * Fetches spots from Re:Earth CMS only.
 * Local (not-yet-persisted) posts are prepended via addLocal().
 */
export function useSpots() {
  const [remoteSpots, setRemoteSpots] = useState<Spot[]>([])
  const [localSpots, setLocalSpots]   = useState<Spot[]>([])
  const [isLoading, setIsLoading]     = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const data = await fetchSpots()
    setRemoteSpots(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const addLocal = useCallback((spot: Spot) => {
    setLocalSpots(prev => [spot, ...prev])
  }, [])

  const spots = [...localSpots, ...remoteSpots]

  return { spots, isLoading, refresh, addLocal }
}
