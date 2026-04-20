import { useMemo, useState } from 'react'
import type { Spot } from '../types'
import { PolaroidCard } from '../components/PolaroidCard'
import { getDiscoverer, setDiscoverer } from '../utils/discoverer'

interface AtlasViewProps {
  spots: Spot[]
  onSelect: (id: string) => void
}

export function AtlasView({ spots, onSelect }: AtlasViewProps) {
  const [name, setName] = useState(getDiscoverer() || '')
  const [editing, setEditing] = useState(!name)

  const mine = useMemo(
    () => spots.filter(s => s.discovererName.trim().toLowerCase() === name.trim().toLowerCase() && name.trim() !== ''),
    [spots, name],
  )

  function save() {
    setDiscoverer(name.trim())
    setEditing(false)
  }

  return (
    <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
        <div className="text-center mb-2">
          <p className="divider-serif text-xs uppercase">Personal Atlas</p>
        </div>
        <h2
          className="font-serif text-center leading-tight"
          style={{ color: '#2B2623', fontSize: '2rem', fontWeight: 600 }}
        >
          Your Sanpo Journal
        </h2>
        <p className="font-jp text-center mt-1 text-sm" style={{ color: '#8a7a6d' }}>
          あなただけの、よりみちの記録
        </p>

        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          {editing ? (
            <>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
              />
              <button
                onClick={save}
                className="px-4 py-2 font-serif text-sm"
                style={{ backgroundColor: '#C4612F', color: '#FDFBF7' }}
              >
                Save
              </button>
            </>
          ) : (
            <p className="font-serif italic text-sm" style={{ color: '#8a7a6d' }}>
              Keeper:{' '}
              <span style={{ color: '#C4612F' }}>{name || 'Anonymous'}</span>
              <button
                onClick={() => setEditing(true)}
                className="ml-2 underline text-xs"
                style={{ color: '#8a7a6d' }}
              >
                change
              </button>
            </p>
          )}
        </div>

        <p className="text-center font-serif italic mt-4" style={{ color: '#8a7a6d' }}>
          {mine.length} {mine.length === 1 ? 'beautiful accident' : 'beautiful accidents'} collected
        </p>

        {mine.length === 0 ? (
          <div className="mt-16 text-center font-serif italic" style={{ color: '#8a7a6d' }}>
            <p>Your journal is still empty.</p>
            <p className="font-jp text-xs mt-2">最初のよりみちを記録してみましょう。</p>
          </div>
        ) : (
          <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-8">
            {mine.map((spot, i) => {
              const rot = ((hashString(spot.id) % 500) / 500 - 0.5) * 5  // -2.5° to 2.5°
              return (
                <div key={spot.id} style={{ padding: '8px' }}>
                  <PolaroidCard
                    spot={spot}
                    onClick={() => onSelect(spot.id)}
                    rotate={rot}
                    size={i % 5 === 2 ? 'sm' : 'md'}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
