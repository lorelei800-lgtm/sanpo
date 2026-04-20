import { useEffect, useState } from 'react'
import type { Spot } from '../types'

interface SpotDetailViewProps {
  spot: Spot
  visitorOrdinal: number
  onClose: () => void
}

export function SpotDetailView({ spot, visitorOrdinal, onClose }: SpotDetailViewProps) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 10)
    return () => clearTimeout(t)
  }, [])

  const date = new Date(spot.discoveredAt)
  const dateStr = date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity"
        style={{ backgroundColor: 'rgba(43,38,35,0.35)', opacity: open ? 1 : 0 }}
      />

      {/* Mobile: bottom sheet / Desktop: right panel */}
      <div
        className="fixed z-50 shadow-2xl transition-transform overflow-y-auto
          inset-x-0 bottom-0 max-h-[88vh] rounded-t-lg
          md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:max-h-full md:rounded-none md:border-l"
        style={{
          transform: open
            ? 'translateY(0) translateX(0)'
            : (typeof window !== 'undefined' && window.innerWidth >= 768 ? 'translateX(100%)' : 'translateY(100%)'),
          borderColor: '#E8E0D2',
          backgroundColor: '#FDFBF7',
        }}
      >
        <div className="p-5 sm:p-6">

          {/* Close */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-serif italic text-xs" style={{ color: '#8a7a6d' }}>
              {spot.tags.length > 0
                ? spot.tags.map(t => `#${t}`).join(' ')
                : 'sanpo'}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-xl"
              style={{ color: '#8a7a6d' }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Polaroid photo */}
          <div className="bg-white p-3 pb-8 shadow-lg mx-auto" style={{ maxWidth: 340 }}>
            <div className="w-full bg-neutral-200" style={{ aspectRatio: '4/3' }}>
              {spot.photoUrl ? (
                <img src={spot.photoUrl} alt={spot.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">📷</div>
              )}
            </div>
            <p className="mt-3 font-serif italic text-center leading-snug px-2 text-sm" style={{ color: '#2B2623' }}>
              {spot.title}
            </p>
          </div>

          {/* Tags as chips */}
          {spot.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {spot.tags.map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-xs font-serif"
                  style={{ backgroundColor: 'rgba(196,97,47,0.08)', color: '#C4612F', border: '1px solid rgba(196,97,47,0.25)' }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {spot.description && (
            <p className="mt-4 font-serif text-sm leading-relaxed" style={{ color: '#2B2623' }}>
              {spot.description}
            </p>
          )}

          {/* Meta */}
          <div className="mt-5 pt-4 border-t space-y-1.5 font-serif text-xs" style={{ borderColor: '#E8E0D2', color: '#6d5f54' }}>
            <p>
              First seen by{' '}
              <span style={{ color: '#C4612F' }}>{spot.discovererName || 'Anonymous'}</span>
              {' · '}{dateStr}
            </p>
            <p className="italic pt-1" style={{ color: '#8a7a6d' }}>
              You are the {formatOrdinal(visitorOrdinal)} to see this.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}
