import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { Spot } from '../types'
import { createPolaroidPinElement } from '../components/PolaroidPin'

const DEFAULT_CENTER: [number, number] = [139.755, 35.710]
const DEFAULT_ZOOM = 12.5

interface MapViewProps {
  spots: Spot[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

export function MapView({ spots, isLoading, selectedId, onSelect }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const fittedRef = useRef(false)

  useEffect(() => {
    if (!mapContainerRef.current) return
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          carto: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution:
              '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxzoom: 19,
          },
        },
        layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
      },
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'bottom-right',
    )
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      fittedRef.current = false
    }
  }, [])

  // Add / update markers when spots change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    if (spots.length === 0) return

    // Auto-fit to spot bounds the first time spots load
    if (!fittedRef.current && spots.length > 0) {
      fittedRef.current = true
      if (spots.length === 1) {
        map.flyTo({ center: [spots[0].lng, spots[0].lat], zoom: 15, duration: 800 })
      } else {
        const lngs = spots.map(s => s.lng)
        const lats = spots.map(s => s.lat)
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 80, maxZoom: 15, duration: 800 },
        )
      }
    }

    for (const spot of spots) {
      const el = createPolaroidPinElement(spot, () => onSelect(spot.id))
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([spot.lng, spot.lat])
        .addTo(map)
      markersRef.current.set(spot.id, marker)
    }
  }, [spots, onSelect])

  // Highlight selected marker
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      el.style.zIndex = id === selectedId ? '10' : '1'
      const inner = el.firstElementChild as HTMLDivElement | null
      if (inner) {
        inner.style.boxShadow = id === selectedId
          ? '0 8px 24px rgba(43, 38, 35, 0.55)'
          : '0 2px 8px rgba(43, 38, 35, 0.25)'
        inner.style.transform = id === selectedId ? 'scale(1.08)' : 'scale(1)'
      }
    })
  }, [selectedId])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className="px-5 py-3 shadow-md font-serif italic text-sm"
            style={{ backgroundColor: '#FDFBF7', color: '#8a7a6d', border: '1px solid #E8E0D2' }}
          >
            Gathering accidents…
          </div>
        </div>
      )}
    </div>
  )
}
