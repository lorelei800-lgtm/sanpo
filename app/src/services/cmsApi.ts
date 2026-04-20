/**
 * Re:Earth CMS REST client for SANPO.
 *
 * Read:  GET /api/{workspace}/projects/{project}/models/{model}/items  (Bearer token)
 * Write: POST same endpoint
 * Assets: POST /api/{workspace}/projects/{project}/assets (Bearer, multipart)
 */
import { CMS } from '../config'
import type { Spot, SpotCategory, Vibe } from '../types'

interface CmsItem {
  id: string
  createdAt: string
  updatedAt: string
  fields?: Array<{ key: string; value: unknown }>
  [key: string]: unknown
}

interface CmsListResponse {
  results?: CmsItem[]
  items?:   CmsItem[]
  totalCount?: number
}

const s = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback

const n = (v: unknown, fallback = 0): number =>
  typeof v === 'number' ? v : fallback

/** Flatten Re:Earth CMS item: handles both flat-field and fields-array formats */
function flatten(item: CmsItem): Record<string, unknown> {
  // If the API returns { fields: [{key, value}, ...] } shape
  if (Array.isArray(item.fields)) {
    const flat: Record<string, unknown> = { id: item.id, createdAt: item.createdAt }
    for (const f of item.fields) flat[f.key] = f.value
    return flat
  }
  // Already flat
  return item as unknown as Record<string, unknown>
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
    category:       (s(f['category']) || 'other') as SpotCategory,
    discoveredAt:   s(f['discovered_at']) || s(f['createdAt']),
    discovererName: s(f['discoverer_name']),
    addressHint:    s(f['address_hint']),
    vibe:           (s(f['vibe']) as Vibe | '') || '',
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

/** Fetch spots via authenticated API (requires token). */
async function fetchAuthenticated(): Promise<CmsItem[]> {
  const url = `${itemsUrl(CMS.spotModel)}?perPage=200&sort=createdAt&dir=desc`
  const res = await fetch(url, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data: CmsListResponse = await res.json()
  return data.results ?? data.items ?? []
}

/** Fetch spots via public API (no token). */
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
    // Prefer authenticated API when token available (always has access)
    const items = CMS.writable
      ? await fetchAuthenticated()
      : await fetchPublic()
    return items.map(itemToSpot)
  } catch (err) {
    console.warn('[CMS] fetchSpots failed', err)
    return []
  }
}

type Field = { key: string; value: unknown }

export async function createSpot(spot: Omit<Spot, 'id'>): Promise<string | null> {
  if (!CMS.writable) return null
  const fields: Field[] = [
    { key: 'title',           value: spot.title },
    { key: 'description',     value: spot.description },
    { key: 'lat',             value: spot.lat },
    { key: 'lng',             value: spot.lng },
    { key: 'photo_url',       value: spot.photoUrl },
    { key: 'category',        value: spot.category },
    { key: 'discovered_at',   value: spot.discoveredAt },
    { key: 'discoverer_name', value: spot.discovererName },
    { key: 'address_hint',    value: spot.addressHint },
    { key: 'vibe',            value: spot.vibe },
  ]
  try {
    const res = await fetch(itemsUrl(CMS.spotModel), {
      method: 'POST',
      headers: authHeaders(),
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ fields }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[CMS] POST spot ${res.status}:`, body)
      return null
    }
    const text = await res.text()
    if (!text) return 'ok'
    const data = JSON.parse(text) as { id?: string }
    return data.id ?? 'ok'
  } catch (err) {
    console.warn('[CMS] createSpot failed', err)
    return null
  }
}

/**
 * Upload a photo file to Re:Earth CMS assets.
 * Returns the public URL of the uploaded asset, or null on failure.
 */
export async function uploadAsset(file: File): Promise<string | null> {
  if (!CMS.writable) return null
  const assetsUrl = `${CMS.baseUrl}/api/${CMS.workspace}/projects/${CMS.project}/assets`
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await fetch(assetsUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CMS.token ?? ''}` },
      body: form,
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[CMS] asset upload ${res.status}:`, body)
      return null
    }
    const data = await res.json() as { url?: string; previewUrl?: string }
    return data.url ?? data.previewUrl ?? null
  } catch (err) {
    console.warn('[CMS] uploadAsset failed', err)
    return null
  }
}
