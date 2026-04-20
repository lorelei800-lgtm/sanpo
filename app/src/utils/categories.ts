import type { SpotCategory, Vibe } from '../types'

interface CatInfo { emoji: string; label: string; labelJa: string }

export const CATEGORIES: Record<SpotCategory, CatInfo> = {
  shrine:   { emoji: '⛩️', label: 'Shrine',   labelJa: '神社' },
  sign:     { emoji: '🪧', label: 'Sign',     labelJa: '看板' },
  cat:      { emoji: '🐈', label: 'Cat',      labelJa: '猫' },
  vending:  { emoji: '🥤', label: 'Vending',  labelJa: '自販機' },
  alley:    { emoji: '🏮', label: 'Alley',    labelJa: '路地' },
  building: { emoji: '🏠', label: 'Building', labelJa: '建物' },
  flower:   { emoji: '🌸', label: 'Flower',   labelJa: '花' },
  other:    { emoji: '✨', label: 'Other',    labelJa: 'その他' },
}

export const CATEGORY_ORDER: SpotCategory[] = [
  'shrine', 'sign', 'cat', 'vending', 'alley', 'building', 'flower', 'other',
]

interface VibeInfo { label: string; labelJa: string }

export const VIBES: Record<Vibe, VibeInfo> = {
  quiet:     { label: 'Quiet',     labelJa: '静か' },
  lively:    { label: 'Lively',    labelJa: '賑やか' },
  forgotten: { label: 'Forgotten', labelJa: '忘れられた' },
  timeless:  { label: 'Timeless',  labelJa: '時を超えた' },
}

export const VIBE_ORDER: Vibe[] = ['quiet', 'lively', 'forgotten', 'timeless']
