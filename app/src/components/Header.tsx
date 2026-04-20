import type { AppView } from '../types'

interface HeaderProps {
  view: AppView
  onNavigate: (view: AppView) => void
  totalCount: number
}

export function Header({ view, onNavigate, totalCount }: HeaderProps) {
  return (
    <header
      className="flex items-center gap-3 px-4 sm:px-6 py-3 flex-shrink-0 border-b z-30"
      style={{ backgroundColor: '#FDFBF7', borderColor: '#E8E0D2' }}
    >
      <button
        onClick={() => onNavigate('map')}
        className="flex items-baseline gap-2 flex-1 min-w-0 text-left"
      >
        <h1
          className="font-serif tracking-wide leading-none"
          style={{ color: '#2B2623', fontSize: '1.5rem', fontWeight: 600 }}
        >
          SANPO
        </h1>
        <span className="font-jp text-sm" style={{ color: '#8a7a6d' }}>散歩</span>
        <span
          className="hidden sm:inline font-serif italic text-xs ml-2"
          style={{ color: '#8a7a6d' }}
        >
          {totalCount} {totalCount === 1 ? 'accident' : 'accidents'} collected
        </span>
      </button>

      <nav className="flex items-center gap-1">
        <NavTab active={view === 'map'}   onClick={() => onNavigate('map')}   label="Map"   labelJa="地図" />
        <NavTab active={view === 'atlas'} onClick={() => onNavigate('atlas')} label="Atlas" labelJa="記録" />
      </nav>
    </header>
  )
}

function NavTab({ active, onClick, label, labelJa }: {
  active: boolean; onClick: () => void; label: string; labelJa: string
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 font-serif text-sm transition-colors"
      style={{
        color: active ? '#C4612F' : '#2B2623',
        borderBottom: active ? '2px solid #C4612F' : '2px solid transparent',
      }}
    >
      {label}
      <span className="font-jp ml-1 text-xs" style={{ color: active ? '#C4612F' : '#8a7a6d' }}>
        {labelJa}
      </span>
    </button>
  )
}
