import type { Spot } from '../types'

/**
 * Creates a DOM element for a Polaroid-style map marker.
 * The outer wrapper is transform-free so MapLibre can position it.
 * The inner .polaroid-pin carries visuals and the stable random rotation.
 */
export function createPolaroidPinElement(spot: Spot, onClick: () => void): HTMLDivElement {
  // Stable pseudo-random rotation based on spot id
  const seed = hashString(spot.id)
  const rotation = ((seed % 500) / 500 - 0.5) * 8  // -4° to +4°

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'width: 48px; height: 56px;'

  const pin = document.createElement('div')
  pin.className = 'polaroid-pin'
  pin.style.transform = `rotate(${rotation.toFixed(2)}deg)`

  const img = document.createElement('img')
  img.src = spot.photoUrl
  img.alt = spot.title
  img.loading = 'lazy'
  img.onerror = () => {
    img.style.display = 'none'
    pin.style.background = '#ede3d3'
  }

  pin.appendChild(img)
  wrapper.appendChild(pin)

  wrapper.addEventListener('click', onClick)
  return wrapper
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}
