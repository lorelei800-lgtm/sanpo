import type { SpotCategory } from '../types'
import { CATEGORIES, CATEGORY_ORDER } from '../utils/categories'

interface CategoryPickerProps {
  value: SpotCategory
  onChange: (v: SpotCategory) => void
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CATEGORY_ORDER.map(cat => {
        const info = CATEGORIES[cat]
        const active = value === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className="flex flex-col items-center justify-center py-3 border transition-colors"
            style={{
              borderColor: active ? '#C4612F' : '#E8E0D2',
              backgroundColor: active ? 'rgba(196,97,47,0.08)' : '#FFFFFF',
            }}
          >
            <span className="text-2xl leading-none">{info.emoji}</span>
            <span
              className="font-serif mt-1"
              style={{
                fontSize: 11,
                color: active ? '#C4612F' : '#2B2623',
              }}
            >
              {info.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
