/**
 * Re:Earth CMS REST client for SANPO.
 *
 * Public read:  GET /api/p/{project}/{model}
 * Auth write:   POST /api/{workspace}/projects/{project}/models/{model}/items
 */
import { CMS, splitProject } from '../config'
import type { Spot, SpotCategory, Vibe } from '../types'

interface CmsItem {
  id: string
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

interface CmsListResponse {
  results: CmsItem[]
  totalCount: number
}

const s = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback

const n = (v: unknown, fallback = 0): number =>
  typeof v === 'number' ? v : fallback

async function publicGet(model: string, params = ''): Promise<CmsItem[]> {
  if (!CMS.enabled) return []
  const url = `${CMS.baseUrl}/api/p/${CMS.project}/${model}${params ? '?' + params : ''}`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    const data: CmsListResponse = await res.json()
    return data.results ?? []
  } catch (err) {
    console.warn(`[CMS] GET ${model} failed`, err)
    return []
  }
}

function itemToSpot(item: CmsItem): Spot {
  return {
    id:             item.id,
    title:          s(item['title']),
    description:    s(item['description']),
    lat:            n(item['lat']),
    lng:            n(item['lng']),
    photoUrl:       s(item['photo_url']),
    category:       (s(item['category']) || 'other') as SpotCategory,
    discoveredAt:   s(item['discovered_at']) || item.createdAt,
    discovererName: s(item['discoverer_name']),
    addressHint:    s(item['address_hint']),
    vibe:           (s(item['vibe']) as Vibe | '') || '',
  }
}

export async function fetchSpots(): Promise<Spot[]> {
  const items = await publicGet(CMS.spotModel, 'perPage=200&sort=discoveredAt&dir=desc')
  return items.map(itemToSpot)
}

type Field = { key: string; value: unknown }

async function writeItem(model: string, fields: Field[]): Promise<string | null> {
  if (!CMS.writable) return null
  const [ws, proj] = splitProject()
  const url = `${CMS.baseUrl}/api/${ws}/projects/${proj}/models/${model}/items`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${CMS.token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ fields }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[CMS] POST ${model} ${res.status}:`, body)
      return null
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') return 'ok'
    const text = await res.text()
    if (!text) return 'ok'
    const data = JSON.parse(text) as { id?: string }
    return data.id ?? 'ok'
  } catch (err) {
    console.warn(`[CMS] POST ${model} failed`, err)
    return null
  }
}

export async function createSpot(spot: Omit<Spot, 'id'>): Promise<string | null> {
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
  return writeItem(CMS.spotModel, fields)
}
