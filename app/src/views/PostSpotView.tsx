import { useEffect, useState } from 'react'
import type { Spot, SpotCategory, Vibe } from '../types'
import { CategoryPicker } from '../components/CategoryPicker'
import { VIBES, VIBE_ORDER } from '../utils/categories'
import { createSpot } from '../services/cmsApi'
import { CMS } from '../config'
import { getDiscoverer, setDiscoverer } from '../utils/discoverer'

interface PostSpotViewProps {
  onClose: () => void
  onPosted: (spot: Spot) => void
}

export function PostSpotView({ onClose, onPosted }: PostSpotViewProps) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl]       = useState('')
  const [category, setCategory]       = useState<SpotCategory>('other')
  const [vibe, setVibe]               = useState<Vibe | ''>('')
  const [lat, setLat]                 = useState<number | null>(null)
  const [lng, setLng]                 = useState<number | null>(null)
  const [addressHint, setAddressHint] = useState('')
  const [name, setName]               = useState(getDiscoverer() || '')
  const [locating, setLocating]       = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => { void requestLocation() }, [])

  async function requestLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocating(false)
      },
      () => {
        // Fallback to Tokyo center if denied
        setLat(35.700)
        setLng(139.755)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('A little caption is required.'); return }
    if (!photoUrl.trim()) { setError('A photo URL is required.'); return }
    if (lat == null || lng == null) { setError('We still need a location.'); return }
    if (!name.trim()) { setError('Tell us who you are.'); return }

    setSubmitting(true)
    setDiscoverer(name.trim())

    const partial: Omit<Spot, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      lat, lng,
      photoUrl: photoUrl.trim(),
      category,
      discoveredAt: new Date().toISOString(),
      discovererName: name.trim(),
      addressHint: addressHint.trim(),
      vibe,
    }

    let id: string | null = null
    if (CMS.writable) {
      id = await createSpot(partial)
    }

    const spot: Spot = {
      id: id ?? `local-${Date.now()}`,
      ...partial,
    }
    setSubmitting(false)
    onPosted(spot)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center md:justify-center p-0 md:p-6"
         style={{ backgroundColor: 'rgba(43, 38, 35, 0.45)' }}>
      <form
        onSubmit={handleSubmit}
        className="bg-cream w-full md:max-w-lg md:shadow-2xl md:border overflow-y-auto"
        style={{ backgroundColor: '#FDFBF7', borderColor: '#E8E0D2', maxHeight: '100dvh' }}
      >
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-xl" style={{ color: '#2B2623' }}>Add a sanpo</h2>
              <p className="font-jp text-xs" style={{ color: '#8a7a6d' }}>よりみちを記録する</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-xl"
              style={{ color: '#8a7a6d' }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <Field label="Photo URL" labelJa="写真のURL">
              <input
                type="url"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://…"
                className="w-full border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
              />
            </Field>

            <Field label="Caption" labelJa="一言メモ">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="A tiny shrine between two vending machines"
                maxLength={120}
                className="w-full border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
              />
            </Field>

            <Field label="Notes (optional)" labelJa="説明（任意）">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
              />
            </Field>

            <Field label="Category" labelJa="種類">
              <CategoryPicker value={category} onChange={setCategory} />
            </Field>

            <Field label="Vibe (optional)" labelJa="雰囲気（任意）">
              <div className="flex flex-wrap gap-2">
                <VibeChip active={vibe === ''} onClick={() => setVibe('')} label="—" />
                {VIBE_ORDER.map(v => (
                  <VibeChip
                    key={v}
                    active={vibe === v}
                    onClick={() => setVibe(v)}
                    label={VIBES[v].label}
                  />
                ))}
              </div>
            </Field>

            <Field label="Address hint (optional)" labelJa="場所の手がかり（任意）">
              <input
                type="text"
                value={addressHint}
                onChange={e => setAddressHint(e.target.value)}
                placeholder="Jinbocho, Chiyoda"
                className="w-full border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
              />
            </Field>

            <Field label="Your name" labelJa="あなたの名前">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Yoshinori"
                className="w-full border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
              />
            </Field>

            <div className="font-serif italic text-xs pt-1" style={{ color: '#8a7a6d' }}>
              {locating
                ? 'Finding you on the map…'
                : lat != null
                  ? `Pinned at ${lat.toFixed(4)}, ${lng!.toFixed(4)}`
                  : 'No location yet.'}
              {!locating && (
                <button
                  type="button"
                  onClick={() => void requestLocation()}
                  className="ml-2 underline"
                  style={{ color: '#C4612F' }}
                >
                  re-locate
                </button>
              )}
            </div>

            {error && (
              <p className="font-serif italic text-sm" style={{ color: '#C4612F' }}>{error}</p>
            )}

            <div className="pt-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 font-serif text-sm tracking-wide transition-opacity"
                style={{
                  backgroundColor: '#C4612F',
                  color: '#FDFBF7',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 font-serif text-sm"
                style={{ color: '#8a7a6d' }}
              >
                Cancel
              </button>
            </div>

            {!CMS.writable && (
              <p className="font-serif italic text-xs text-center pt-1" style={{ color: '#8a7a6d' }}>
                Offline mode: this sanpo lives only in your browser.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({ label, labelJa, children }: { label: string; labelJa: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1 font-serif text-sm" style={{ color: '#2B2623' }}>
        {label}
        <span className="font-jp ml-2 text-xs" style={{ color: '#8a7a6d' }}>{labelJa}</span>
      </span>
      {children}
    </label>
  )
}

function VibeChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 font-serif text-xs border transition-colors"
      style={{
        borderColor: active ? '#C4612F' : '#E8E0D2',
        backgroundColor: active ? 'rgba(196,97,47,0.08)' : '#FFFFFF',
        color: active ? '#C4612F' : '#2B2623',
      }}
    >
      {label}
    </button>
  )
}
