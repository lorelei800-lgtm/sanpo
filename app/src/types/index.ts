export interface Spot {
  id: string
  title: string
  description: string
  lat: number
  lng: number
  photoUrl: string
  tags: string[]          // free-form, max 3
  discoveredAt: string    // ISO date
  discovererName: string
}

export type AppView = 'map' | 'atlas' | 'post'
