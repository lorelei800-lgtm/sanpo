import { useEffect, useRef, useState } from 'react'
import type { Spot, SpotCategory, Vibe } from '../types'
import { CategoryPicker } from '../components/CategoryPicker'
import { VIBES, VIBE_ORDER } from '../utils/categories'
import { createSpot, uploadAsset } from '../services/cmsApi'
import { CMS } from '../config'
import { getDiscoverer, setDiscoverer } from '../utils/discoverer'

interface PostSpotViewProps {
  onClose: () => void
  onPosted: (spot: Spot) => void
}

export function PostSpotView({ onClose, onPosted }: PostSpotViewProps) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile]     = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadedUrl, setUploadedUrl] = useState<string>('')
  const [category, setCategory]       = useState<SpotCategory>('other')
  const [vibe, setVibe]               = useState<Vibe | ''>('')
  const [lat, setLat]                 = useState<number | null>(null)
  const [lng, setLng]                 = useState<number | null>(null)
  const [addressHint, setAddressHint] = useState('')
  const [name, setName]               = useState(getDiscoverer() || '')
  const [locating, setLocating]       = useState(false)
  const [locError, setLocError]       = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { void requestLocation() }, [])

  async function requestLocation() {
    if (!navigator.geolocation) { setLocError(true); return }
    setLocating(true)
    setLocError(false)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocError(true)
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setUploadedUrl('')
    setUploadProgress('idle')
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    if (!photoFile) return
    setUploadProgress('uploading')
    const url = await uploadAsset(photoFile)
    if (url) {
      setUploadedUrl(url)
      setUploadProgress('done')
    } else {
      setUploadProgress('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('A little caption is required.'); return }
    if (!photoPreview) { setError('Please choose a photo.'); return }
    if (lat == null || lng == null) { setError('Location is still needed — tap "retry" above.'); return }
    if (!name.trim()) { setError('Tell us who you are.'); return }

    setSubmitting(true)
    setDiscoverer(name.trim())

    // If CMS writable and photo not yet uploaded, upload now
    let finalPhotoUrl = uploadedUrl
    if (CMS.writable && photoFile && !uploadedUrl) {
      setUploadProgress('uploading')
      const url = await uploadAsset(photoFile)
      if (url) {
        finalPhotoUrl = url
        setUploadedUrl(url)
        setUploadProgress('done')
      } else {
        setUploadProgress('error')
        // Fall back to data URL so the post still works locally
        finalPhotoUrl = photoPreview
      }
    }

    // If not writable, use the local data URL (browser-only)
    if (!finalPhotoUrl) finalPhotoUrl = photoPreview

    const partial: Omit<Spot, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      lat, lng,
      photoUrl: finalPhotoUrl,
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

    const spot: Spot = { id: id ?? `local-${Date.now()}`, ...partial }
    setSubmitting(false)
    onPosted(spot)
  }

  const photoReady = !!photoPreview

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch md:items-center md:justify-center p-0 md:p-6"
      style={{ backgroundColor: 'rgba(43, 38, 35, 0.45)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-lg md:shadow-2xl md:border overflow-y-auto"
        style={{ backgroundColor: '#FDFBF7', borderColor: '#E8E0D2', maxHeight: '100dvh' }}
      >
        <div className="p-5 sm:p-7">
          {/* Header */}
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
            {/* Photo picker */}
            <div>
              <span className="block mb-1 font-serif text-sm" style={{ color: '#2B2623' }}>
                Photo <span className="font-jp ml-2 text-xs" style={{ color: '#8a7a6d' }}>写真</span>
              </span>

              {/* Preview */}
              {photoPreview && (
                <div className="mb-2 relative" style={{ paddingTop: '56.25%' }}>
                  <img
                    src={photoPreview}
                    alt="preview"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ border: '4px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 font-serif text-sm border transition-colors"
                style={{
                  borderColor: '#E8E0D2',
                  backgroundColor: photoReady ? '#f5f0eb' : '#ffffff',
                  color: '#2B2623',
                }}
              >
                {photoReady ? '📷 Change photo' : '📷 Choose photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload status */}
              {photoFile && CMS.writable && uploadProgress === 'idle' && (
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  className="mt-1 text-xs font-serif underline"
                  style={{ color: '#C4612F' }}
                >
                  Upload to CMS now
                </button>
              )}
              {uploadProgress === 'uploading' && (
                <p className="mt-1 text-xs font-serif italic" style={{ color: '#8a7a6d' }}>Uploading photo…</p>
              )}
              {uploadProgress === 'done' && (
                <p className="mt-1 text-xs font-serif" style={{ color: '#009E73' }}>✓ Photo uploaded</p>
              )}
              {uploadProgress === 'error' && (
                <p className="mt-1 text-xs font-serif" style={{ color: '#C4612F' }}>Upload failed — photo saved locally only</p>
              )}
            </div>

            {/* Caption */}
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

            {/* Notes */}
            <Field label="Notes (optional)" labelJa="説明（任意）">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
              />
            </Field>

            {/* Category */}
            <Field label="Category" labelJa="種類">
              <CategoryPicker value={category} onChange={setCategory} />
            </Field>

            {/* Vibe */}
            <Field label="Vibe (optional)" labelJa="雰囲気（任意）">
              <div className="flex flex-wrap gap-2">
                <VibeChip active={vibe === ''} onClick={() => setVibe('')} label="—" />
                {VIBE_ORDER.map(v => (
                  <VibeChip key={v} active={vibe === v} onClick={() => setVibe(v)} label={VIBES[v].label} />
                ))}
              </div>
            </Field>

            {/* Address hint */}
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

            {/* Your name */}
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

            {/* Location */}
            <div className="font-serif italic text-xs pt-1" style={{ color: '#8a7a6d' }}>
              {locating ? (
                '📍 Finding your location…'
              ) : locError ? (
                <>
                  <span style={{ color: '#C4612F' }}>Location unavailable.</span>
                  {' '}
                  <button
                    type="button"
                    onClick={() => void requestLocation()}
                    className="underline"
                    style={{ color: '#C4612F' }}
                  >
                    Retry
                  </button>
                  {' or '}
                  <button
                    type="button"
                    onClick={() => { setLat(35.700); setLng(139.755); setLocError(false) }}
                    className="underline"
                    style={{ color: '#8a7a6d' }}
                  >
                    use Tokyo center
                  </button>
                </>
              ) : lat != null ? (
                <>
                  📍 {lat.toFixed(4)}, {lng!.toFixed(4)}
                  {' · '}
                  <button
                    type="button"
                    onClick={() => void requestLocation()}
                    className="underline"
                    style={{ color: '#C4612F' }}
                  >
                    refresh
                  </button>
                </>
              ) : (
                'No location yet.'
              )}
            </div>

            {error && (
              <p className="font-serif italic text-sm" style={{ color: '#C4612F' }}>{error}</p>
            )}

            {/* Submit */}
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
                Offline mode — this sanpo lives only in your browser.
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
