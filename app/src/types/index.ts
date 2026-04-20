export type SpotCategory =
  | 'shrine'
  | 'sign'
  | 'cat'
  | 'vending'
  | 'alley'
  | 'building'
  | 'flower'
  | 'other'

export type Vibe = 'quiet' | 'lively' | 'forgotten' | 'timeless'

export interface Spot {
  id: string
  title: string
  description: string
  lat: number
  lng: number
  photoUrl: string
  category: SpotCategory
  discoveredAt: string  // ISO date
  discovererName: string
  addressHint: string
  vibe: Vibe | ''
}

export type AppView = 'map' | 'atlas' | 'post'
