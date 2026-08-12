const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const RATE_LIMIT_MS = 1000

let ultimaPeticion = 0

async function esperarRateLimit() {
  const espera = RATE_LIMIT_MS - (Date.now() - ultimaPeticion)
  if (espera > 0) await new Promise(resolve => setTimeout(resolve, espera))
  ultimaPeticion = Date.now()
}

/**
 * Geocodifica una dirección usando Nominatim (OpenStreetMap).
 * Retorna un arreglo de candidatos { lat, lng, displayName, importance } (vacío si no hubo resultados).
 * Nominatim no indexa la numeración de casas en Guatemala, así que varias calles con
 * el mismo nombre dentro de la misma zona pueden aparecer como candidatos distintos —
 * por eso se piden varios resultados en vez de asumir que el primero es el correcto.
 * Respeta el límite de 1 petición/segundo de Nominatim de forma serializada.
 */
export async function geocodificarDireccion(direccion, limit = 5) {
  await esperarRateLimit()

  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(direccion)}&countrycodes=gt&format=json&limit=${limit}`
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
  if (!res.ok) throw new Error('Error al consultar el servicio de geocodificación')

  const data = await res.json()
  return data.map(d => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    displayName: d.display_name,
    importance: d.importance,
  }))
}
