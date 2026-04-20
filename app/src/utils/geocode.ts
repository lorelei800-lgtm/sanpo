/**
 * Stub reverse-geocoder. In a real deploy this would call a service.
 * For now it returns an empty string; the user can type an address hint manually.
 */
export async function reverseGeocode(_lat: number, _lng: number): Promise<string> {
  return ''
}
