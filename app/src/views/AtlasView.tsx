import { useMemo, useState } from 'react'
import type { Spot } from '../types'
import { PolaroidCard } from '../components/PolaroidCard'
import { getDiscoverer, setDiscoverer } from '../utils/discoverer'

interface AtlasViewProps {
  spots: Spot[]
  onSelect: (id: string) => void
}

export function AtlasView({ spots, onSelect }: AtlasViewProps) {
  const [name, setName]           = useState(getDiscoverer() || '')
  const [editing, setEditing]     = useState(!name)
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())

  // Spots belonging to this user
  const mine = useMemo(
    () => spots.filter(s =>
      name.trim() !== '' &&
      s.discovererName.trim().toLowerCase() === name.trim().toLowerCase()
    ),
    [spots, name],
  )

  // All unique tags across user's spots, sorted by frequency
  const allTags = useMemo(() => {
    const freq = new Map<string, number>()
    for (const s of mine) {
      for (const t of s.tags) freq.set(t, (freq.get(t) ?? 0) + 1)
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([t, count]) => ({ tag: t, count }))
  }, [mine])

  // Filtered spots (AND logic: spot must have ALL active tags)
  const filtered = useMemo(() => {
    if (activeTags.size === 0) return mine
    return mine.filter(s => [...activeTags].every(t => s.tags.includes(t)))
  }, [mine, activeTags])

  function toggleTag(t: string) {
    setActiveTags(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
  }

  function save() {
    setDiscoverer(name.trim())
    setEditing(false)
    setActiveTags(new Set())
  }

  return (
    <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">

        {/* Title */}
        <div className="text-center mb-2">
          <p className="divider-serif text-xs uppercase tracking-widest" style={{ color: '#8a7a6d' }}>Personal Atlas</p>
        </div>
        <h2 className="font-serif text-center leading-tight" style={{ color: '#2B2623', fontSize: '2rem', fontWeight: 600 }}>
          Your Sanpo Journal
        </h2>
        <p className="font-jp text-center mt-1 text-sm" style={{ color: '#8a7a6d' }}>
          あなただけの、よりみちの記録
        </p>

        {/* Name / keeper */}
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          {editing ? (
            <>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
                onKeyDown={e => e.key === 'Enter' && save()}
              />
              <button onClick={save} className="px-4 py-2 font-serif text-sm" style={{ backgroundColor: '#C4612F', color: '#FDFBF7' }}>
                Save
              </button>
            </>
          ) : (
            <p className="font-serif italic text-sm" style={{ color: '#8a7a6d' }}>
              Keeper: <span style={{ color: '#C4612F' }}>{name || 'Anonymous'}</span>
              <button onClick={() => setEditing(true)} className="ml-2 underline text-xs" style={{ color: '#8a7a6d' }}>change</button>
            </p>
          )}
        </div>

        {/* Count */}
        <p className="text-center font-serif italic mt-3 text-sm" style={{ color: '#8a7a6d' }}>
          {activeTags.size > 0
            ? `${filtered.length} of ${mine.length} ${mine.length === 1 ? 'accident' : 'accidents'}`
            : `${mine.length} ${mine.length === 1 ? 'beautiful accident' : 'beautiful accidents'} collected`}
        </p>

        {/* Tag filters — only show when user has spots with tags */}
        {allTags.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {allTags.map(({ tag, count }) => {
              const active = activeTags.has(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1 text-xs font-serif border transition-colors"
                  style={{
                    borderColor:     active ? '#C4612F' : '#E8E0D2',
                    backgroundColor: active ? 'rgba(196,97,47,0.10)' : '#fff',
                    color:           active ? '#C4612F' : '#6d5f54',
                  }}
                >
                  #{tag}
                  <span className="ml-1 opacity-60">{count}</span>
                </button>
              )
            })}
            {activeTags.size > 0 && (
              <button
                onClick={() => setActiveTags(new Set())}
                className="px-3 py-1 text-xs font-serif"
                style={{ color: '#8a7a6d', textDecoration: 'underline' }}
              >
                clear
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {mine.length === 0 ? (
          <div className="mt-16 text-center font-serif italic" style={{ color: '#8a7a6d' }}>
            <p>Your journal is still empty.</p>
            <p className="font-jp text-xs mt-2">最初のよりみちを記録してみましょう。</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center font-serif italic" style={{ color: '#8a7a6d' }}>
            <p>No spots match the selected tags.</p>
            <button onClick={() => setActiveTags(new Set())} className="mt-2 underline text-xs" style={{ color: '#C4612F' }}>Clear filters</button>
          </div>
        ) : (
          <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-8">
            {filtered.map((spot, i) => {
              const rot = ((hashString(spot.id) % 500) / 500 - 0.5) * 5
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
