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

  useEffect(() => {
    if (!mapContainerRef.current) return
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          toner: {
            type: 'raster',
            tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution:
              '© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://stamen.com/">Stamen Design</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [{ id: 'toner', type: 'raster', source: 'toner' }],
      },
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    // Fallback: if Stamen tiles fail to load, swap in OSM
    map.on('error', (e) => {
      const msg = String(e?.error?.message ?? '')
      if (msg.includes('toner') || msg.includes('stadia')) {
        if (map.getLayer('toner')) map.removeLayer('toner')
        if (!map.getLayer('osm')) {
          map.addLayer({ id: 'osm', type: 'raster', source: 'osm' })
        }
      }
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
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    if (spots.length === 0) return

    for (const spot of spots) {
      const el = createPolaroidPinElement(spot, () => onSelect(spot.id))
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([spot.lng, spot.lat])
        .addTo(map)
      markersRef.current.set(spot.id, marker)
    }
  }, [spots, onSelect])

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      el.style.zIndex = id === selectedId ? '10' : '1'
      const inner = el.firstElementChild as HTMLDivElement | null
      if (inner) {
        inner.style.boxShadow = id === selectedId
          ? '0 6px 18px rgba(43, 38, 35, 0.5)'
          : '0 2px 6px rgba(43, 38, 35, 0.25)'
      }
    })
  }, [selectedId])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream/50 z-20 pointer-events-none">
          <div className="bg-white px-5 py-3 shadow-md font-serif italic text-sm" style={{ color: '#8a7a6d' }}>
            Gathering accidents…
          </div>
        </div>
      )}
    </div>
  )
}
