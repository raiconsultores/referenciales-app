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
 * Retorna { lat, lng } o null si no se encontró ningún resultado.
 * Respeta el límite de 1 petición/segundo de Nominatim de forma serializada.
 */
export async function geocodificarDireccion(direccion) {
  await esperarRateLimit()

  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(direccion)}&countrycodes=gt&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
  if (!res.ok) throw new Error('Error al consultar el servicio de geocodificación')

  const data = await res.json()
  if (!data.length) return null

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}
