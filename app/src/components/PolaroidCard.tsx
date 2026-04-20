import type { Spot } from '../types'
import { CATEGORIES } from '../utils/categories'

interface PolaroidCardProps {
  spot: Spot
  onClick?: () => void
  rotate?: number  // degrees
  size?: 'sm' | 'md'
}

export function PolaroidCard({ spot, onClick, rotate = 0, size = 'md' }: PolaroidCardProps) {
  const isSm = size === 'sm'
  const cat = CATEGORIES[spot.category]
  return (
    <button
      onClick={onClick}
      className="bg-white p-2 pb-4 shadow-md hover:shadow-xl transition-all text-left"
      style={{
        transform: `rotate(${rotate}deg)`,
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(0deg) scale(1.03)')}
      onMouseLeave={e => (e.currentTarget.style.transform = `rotate(${rotate}deg)`)}
    >
      <div
        className="overflow-hidden bg-neutral-200"
        style={{ width: isSm ? 140 : 200, height: isSm ? 140 : 200 }}
      >
        {spot.photoUrl ? (
          <img
            src={spot.photoUrl}
            alt={spot.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">{cat.emoji}</div>
        )}
      </div>
      <p
        className="mt-2 font-serif italic leading-snug"
        style={{
          width: isSm ? 140 : 200,
          fontSize: isSm ? 11 : 13,
          color: '#2B2623',
        }}
      >
        <span className="mr-1">{cat.emoji}</span>
        {spot.title}
      </p>
    </button>
  )
}
