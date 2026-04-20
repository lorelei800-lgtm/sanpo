import { useEffect, useRef, useState } from 'react'
import type { Spot } from '../types'
import { createSpot, uploadAsset } from '../services/cmsApi'
import { CMS } from '../config'
import { getDiscoverer, setDiscoverer } from '../utils/discoverer'

const TAG_SUGGESTIONS = ['shrine', 'cat', 'sign', 'alley', 'vending', 'flower', 'stairs', 'moss', 'window', 'shadow']
const MAX_TAGS = 3

interface PostSpotViewProps {
  onClose: () => void
  onPosted: (spot: Spot) => void
}

export function PostSpotView({ onClose, onPosted }: PostSpotViewProps) {
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [showNotes, setShowNotes]       = useState(false)
  const [photoFile, setPhotoFile]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploading, setUploading]       = useState(false)
  const [uploadedUrl, setUploadedUrl]   = useState('')
  const [tags, setTags]                 = useState<string[]>([])
  const [tagInput, setTagInput]         = useState('')
  const [lat, setLat]                   = useState<number | null>(null)
  const [lng, setLng]                   = useState<number | null>(null)
  const [locating, setLocating]         = useState(false)
  const [locError, setLocError]         = useState(false)
  const [name, setName]                 = useState(getDiscoverer() || '')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { void requestLocation() }, [])

  async function requestLocation() {
    if (!navigator.geolocation) { setLocError(true); return }
    setLocating(true); setLocError(false)
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false) },
      ()  => { setLocating(false); setLocError(true) },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file); setUploadedUrl('')
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function commitTag(raw: string) {
    const t = raw.toLowerCase().replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9fff]/g, '').slice(0, 24)
    if (!t || tags.includes(t) || tags.length >= MAX_TAGS) return
    setTags(prev => [...prev, t])
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitTag(tagInput)
      setTagInput('')
    } else if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  function removeTag(t: string) { setTags(prev => prev.filter(x => x !== t)) }

  function addSuggestion(t: string) {
    commitTag(t)
    tagInputRef.current?.focus()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('A caption is required.'); return }
    if (!photoPreview)  { setError('Please choose a photo.'); return }
    if (lat == null || lng == null) { setError('Location is needed — tap Retry below.'); return }
    if (!name.trim())  { setError('Your name is required.'); return }

    setSubmitting(true)
    setDiscoverer(name.trim())

    // Upload photo
    let finalPhotoUrl = uploadedUrl
    if (CMS.writable && photoFile && !uploadedUrl) {
      setUploading(true)
      finalPhotoUrl = (await uploadAsset(photoFile)) ?? photoPreview
      setUploadedUrl(finalPhotoUrl)
      setUploading(false)
    }
    if (!finalPhotoUrl) finalPhotoUrl = photoPreview

    const partial: Omit<Spot, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      lat, lng,
      photoUrl: finalPhotoUrl,
      tags,
      discoveredAt: new Date().toISOString(),
      discovererName: name.trim(),
    }

    const id = CMS.writable ? await createSpot(partial) : null
    setSubmitting(false)
    onPosted({ id: id ?? `local-${Date.now()}`, ...partial })
  }

  const canAddTag = tags.length < MAX_TAGS

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch md:items-center md:justify-center p-0 md:p-6"
      style={{ backgroundColor: 'rgba(43,38,35,0.45)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full md:max-w-md md:shadow-2xl md:border overflow-y-auto"
        style={{ backgroundColor: '#FDFBF7', borderColor: '#E8E0D2', maxHeight: '100dvh' }}
      >
        <div className="p-5 sm:p-6 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl" style={{ color: '#2B2623' }}>Add a sanpo</h2>
              <p className="font-jp text-xs" style={{ color: '#8a7a6d' }}>よりみちを記録する</p>
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center text-xl" style={{ color: '#8a7a6d' }} aria-label="Close">×</button>
          </div>

          {/* Photo */}
          <div>
            {photoPreview && (
              <div className="mb-2" style={{ position: 'relative', paddingTop: '56.25%' }}>
                <img
                  src={photoPreview} alt="preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ border: '4px solid white', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 font-serif text-sm border"
              style={{ borderColor: '#E8E0D2', backgroundColor: photoPreview ? '#f5f0eb' : '#fff', color: '#2B2623' }}
            >
              {photoPreview ? '📷 Change photo' : '📷 Choose photo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            {uploading && <p className="mt-1 text-xs font-serif italic" style={{ color: '#8a7a6d' }}>Uploading…</p>}
          </div>

          {/* Caption */}
          <div>
            <label className="block mb-1 font-serif text-sm" style={{ color: '#2B2623' }}>
              Caption <span className="font-jp text-xs ml-1" style={{ color: '#8a7a6d' }}>一言メモ</span>
            </label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="A tiny shrine between two vending machines"
              maxLength={120}
              className="w-full border px-3 py-2 bg-white font-serif text-sm"
              style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block mb-1 font-serif text-sm" style={{ color: '#2B2623' }}>
              Tags <span className="font-jp text-xs ml-1" style={{ color: '#8a7a6d' }}>タグ（最大{MAX_TAGS}つ）</span>
            </label>

            {/* Added tag chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-serif"
                    style={{ backgroundColor: 'rgba(196,97,47,0.10)', color: '#C4612F', border: '1px solid rgba(196,97,47,0.3)' }}
                  >
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} className="text-xs leading-none" style={{ color: '#C4612F' }}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom text input — clearly visible */}
            {canAddTag && (
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput) { commitTag(tagInput); setTagInput('') } }}
                placeholder="Type a tag + Enter  (例: narrow, retro, hidden…)"
                className="w-full border px-3 py-2 bg-white font-serif text-sm"
                style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
              />
            )}
            {!canAddTag && (
              <p className="text-xs font-serif italic" style={{ color: '#8a7a6d' }}>Max {MAX_TAGS} tags reached</p>
            )}

            {/* Quick-pick suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TAG_SUGGESTIONS.filter(t => !tags.includes(t)).slice(0, 8).map(t => (
                <button
                  key={t} type="button"
                  onClick={() => addSuggestion(t)}
                  disabled={!canAddTag}
                  className="px-2 py-1 text-xs font-serif border"
                  style={{
                    borderColor: '#E8E0D2',
                    color: canAddTag ? '#6d5f54' : '#c0b8b0',
                    backgroundColor: '#fff',
                  }}
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>

          {/* Notes (collapsible) */}
          <div>
            {!showNotes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="font-serif italic text-xs underline"
                style={{ color: '#8a7a6d' }}
              >
                + Add notes
              </button>
            ) : (
              <div>
                <label className="block mb-1 font-serif text-sm" style={{ color: '#2B2623' }}>
                  Notes <span className="font-jp text-xs ml-1" style={{ color: '#8a7a6d' }}>メモ</span>
                </label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={2} autoFocus
                  className="w-full border px-3 py-2 bg-white font-serif text-sm"
                  style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
                />
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block mb-1 font-serif text-sm" style={{ color: '#2B2623' }}>
              Your name <span className="font-jp text-xs ml-1" style={{ color: '#8a7a6d' }}>あなたの名前</span>
            </label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Yoshinori"
              className="w-full border px-3 py-2 bg-white font-serif text-sm"
              style={{ borderColor: '#E8E0D2', color: '#2B2623' }}
            />
          </div>

          {/* Location */}
          <p className="font-serif italic text-xs" style={{ color: '#8a7a6d' }}>
            {locating ? '📍 Finding your location…' : locError ? (
              <>
                <span style={{ color: '#C4612F' }}>Location unavailable. </span>
                <button type="button" onClick={() => void requestLocation()} className="underline" style={{ color: '#C4612F' }}>Retry</button>
                {' · '}
                <button type="button" onClick={() => { setLat(35.700); setLng(139.755); setLocError(false) }} className="underline" style={{ color: '#8a7a6d' }}>Use Tokyo center</button>
              </>
            ) : lat != null ? (
              <>📍 {lat.toFixed(4)}, {lng!.toFixed(4)} · <button type="button" onClick={() => void requestLocation()} className="underline" style={{ color: '#C4612F' }}>refresh</button></>
            ) : 'No location yet.'}
          </p>

          {error && <p className="font-serif italic text-sm" style={{ color: '#C4612F' }}>{error}</p>}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit" disabled={submitting}
              className="flex-1 py-3 font-serif text-sm tracking-wide"
              style={{ backgroundColor: '#C4612F', color: '#FDFBF7', opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
            <button type="button" onClick={onClose} className="py-3 px-4 font-serif text-sm" style={{ color: '#8a7a6d' }}>Cancel</button>
          </div>

          {!CMS.writable && (
            <p className="font-serif italic text-xs text-center" style={{ color: '#8a7a6d' }}>
              Offline mode — this sanpo lives only in your browser.
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
