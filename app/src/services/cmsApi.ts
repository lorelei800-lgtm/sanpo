/**
 * Re:Earth CMS REST client for SANPO.
 *
 * Read:   GET  /api/{workspace}/projects/{project}/models/{model}/items  (Bearer)
 * Write:  POST same endpoint
 * Assets: POST /api/{workspace}/projects/{project}/assets (Bearer, multipart)
 */
import { CMS } from '../config'
import type { Spot } from '../types'

interface CmsField { key: string; value: unknown }

interface CmsItem {
  id: string
  createdAt: string
  fields?: CmsField[]
  [key: string]: unknown
}

interface CmsListResponse {
  results?: CmsItem[]
  items?:   CmsItem[]
}

const s = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback

const n = (v: unknown, fallback = 0): number =>
  typeof v === 'number' ? v : fallback

/** Normalise Re:Earth CMS item to a flat key→value map */
function flatten(item: CmsItem): Record<string, unknown> {
  if (Array.isArray(item.fields)) {
    const flat: Record<string, unknown> = { id: item.id, createdAt: item.createdAt }
    for (const f of item.fields) flat[f.key] = f.value
    return flat
  }
  return item as unknown as Record<string, unknown>
}

/** Parse comma-separated tags string or old category field as fallback */
function parseTags(f: Record<string, unknown>): string[] {
  // Prefer new `tags` field
  if (typeof f['tags'] === 'string' && f['tags']) {
    return f['tags'].split(',').map(t => t.trim()).filter(Boolean).slice(0, 3)
  }
  // Backwards-compat: use old category as a single tag
  if (typeof f['category'] === 'string' && f['category'] && f['category'] !== 'other') {
    return [f['category']]
  }
  return []
}

function itemToSpot(item: CmsItem): Spot {
  const f = flatten(item)
  return {
    id:             s(f['id']),
    title:          s(f['title']),
    description:    s(f['description']),
    lat:            n(f['lat']),
    lng:            n(f['lng']),
    photoUrl:       s(f['photo_url']),
    tags:           parseTags(f),
    discoveredAt:   s(f['discovered_at']) || s(f['createdAt']),
    discovererName: s(f['discoverer_name']),
  }
}

function authHeaders(): Record<string, string> {
  return {
    Authorization:  `Bearer ${CMS.token ?? ''}`,
    'Content-Type': 'application/json',
  }
}

function itemsUrl(model: string): string {
  return `${CMS.baseUrl}/api/${CMS.workspace}/projects/${CMS.project}/models/${model}/items`
}

async function fetchAuthenticated(): Promise<CmsItem[]> {
  const url = `${itemsUrl(CMS.spotModel)}?perPage=200&sort=createdAt&dir=desc`
  const res = await fetch(url, { headers: authHeaders(), signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data: CmsListResponse = await res.json()
  return data.results ?? data.items ?? []
}

async function fetchPublic(): Promise<CmsItem[]> {
  const url = `${CMS.baseUrl}/api/p/${CMS.project}/${CMS.spotModel}?perPage=200&sort=createdAt&dir=desc`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data: CmsListResponse = await res.json()
  return data.results ?? data.items ?? []
}

export async function fetchSpots(): Promise<Spot[]> {
  if (!CMS.enabled) return []
  try {
    const items = CMS.writable ? await fetchAuthenticated() : await fetchPublic()
    return items.map(itemToSpot)
  } catch (err) {
    console.warn('[CMS] fetchSpots failed', err)
    return []
  }
}

export async function createSpot(spot: Omit<Spot, 'id'>): Promise<string | null> {
  if (!CMS.writable) return null
  const fields: CmsField[] = [
    { key: 'title',           value: spot.title },
    { key: 'description',     value: spot.description },
    { key: 'lat',             value: spot.lat },
    { key: 'lng',             value: spot.lng },
    { key: 'photo_url',       value: spot.photoUrl },
    { key: 'tags',            value: spot.tags.join(', ') },
    { key: 'discovered_at',   value: spot.discoveredAt },
    { key: 'discoverer_name', value: spot.discovererName },
  ]
  try {
    const res = await fetch(itemsUrl(CMS.spotModel), {
      method: 'POST',
      headers: authHeaders(),
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ fields }),
    })
    if (!res.ok) { console.warn(`[CMS] POST spot ${res.status}`); return null }
    const text = await res.text()
    if (!text) return 'ok'
    const data = JSON.parse(text) as { id?: string }
    return data.id ?? 'ok'
  } catch (err) {
    console.warn('[CMS] createSpot failed', err)
    return null
  }
}

export async function uploadAsset(file: File): Promise<string | null> {
  if (!CMS.writable) return null
  const url = `${CMS.baseUrl}/api/${CMS.workspace}/projects/${CMS.project}/assets`
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CMS.token ?? ''}` },
      body: form,
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) { console.warn(`[CMS] asset upload ${res.status}`); return null }
    const data = await res.json() as { url?: string; previewUrl?: string }
    return data.url ?? data.previewUrl ?? null
  } catch (err) {
    console.warn('[CMS] uploadAsset failed', err)
    return null
  }
}
