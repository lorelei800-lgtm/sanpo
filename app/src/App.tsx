import { useCallback, useState } from 'react'
import { Header } from './components/Header'
import { FAB } from './components/FAB'
import { MapView } from './views/MapView'
import { AtlasView } from './views/AtlasView'
import { SpotDetailView } from './views/SpotDetailView'
import { PostSpotView } from './views/PostSpotView'
import { useSpots } from './hooks/useSpots'
import type { AppView, Spot } from './types'

export default function App() {
  const { spots, isLoading, addLocal } = useSpots()
  const [view, setView] = useState<AppView>('map')
  const [posting, setPosting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedIndex = selectedId ? spots.findIndex(s => s.id === selectedId) : -1
  const selectedSpot: Spot | null = selectedIndex >= 0 ? spots[selectedIndex] : null
  // Mock "Nth visitor": use 1-based index from the end (oldest = more visitors)
  const visitorOrdinal = selectedIndex >= 0 ? spots.length - selectedIndex + 1 : 1

  const handleNavigate = useCallback((v: AppView) => {
    if (v === 'post') { setPosting(true); return }
    setView(v)
    setSelectedId(null)
  }, [])

  const handleSelect = useCallback((id: string) => setSelectedId(id), [])

  const handlePosted = useCallback((spot: Spot) => {
    addLocal(spot)
    setPosting(false)
    setView('map')
    setSelectedId(spot.id)
  }, [addLocal])

  return (
    <div className="w-full flex flex-col" style={{ height: '100dvh', backgroundColor: '#FDFBF7' }}>
      <Header view={view} onNavigate={handleNavigate} totalCount={spots.length} />

      <main className="flex-1 relative overflow-hidden">
        {view === 'map' && (
          <MapView
            spots={spots}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}

        {view === 'atlas' && (
          <AtlasView spots={spots} onSelect={(id) => { setSelectedId(id) }} />
        )}

        {selectedSpot && (
          <SpotDetailView
            spot={selectedSpot}
            visitorOrdinal={visitorOrdinal}
            onClose={() => setSelectedId(null)}
          />
        )}

        {posting && (
          <PostSpotView
            onClose={() => setPosting(false)}
            onPosted={handlePosted}
          />
        )}

        <FAB onClick={() => setPosting(true)} />
      </main>
    </div>
  )
}
