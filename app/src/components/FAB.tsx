interface FABProps {
  onClick: () => void
  label?: string
}

export function FAB({ onClick, label = 'Add a sanpo' }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed bottom-6 right-6 z-20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        backgroundColor: '#C4612F',
        color: '#FDFBF7',
        boxShadow: '0 6px 18px rgba(196, 97, 47, 0.45)',
        fontSize: 28,
        fontWeight: 300,
        lineHeight: 1,
      }}
    >
      +
    </button>
  )
}
