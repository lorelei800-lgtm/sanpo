const KEY = 'sanpo.discoverer'

export function getDiscoverer(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setDiscoverer(name: string): void {
  try {
    localStorage.setItem(KEY, name)
  } catch {
    // ignore
  }
}
