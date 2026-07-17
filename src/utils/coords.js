// Acepta decimal 14.619167, -90.614444 o GMS 14°31'46"N 90°25'56"O
export function parseCoords(str) {
  if (!str.trim()) return { lat: null, lng: null, valid: false }

  // String.fromCharCode evita poner grado(176) comilla(39) doble(34) en el fuente JSX
  const DEG = String.fromCharCode(176)
  const MIN = String.fromCharCode(39)
  const SEC = String.fromCharCode(34)
  const dmsPattern =
    "(\\d{1,3})" + DEG + "\\s*(\\d{1,2})" + MIN + "\\s*(\\d+(?:\\.\\d+)?)\\s*" + SEC + "\\s*([NSns])" +
    "\\s*,?\\s*" +
    "(\\d{1,3})" + DEG + "\\s*(\\d{1,2})" + MIN + "\\s*(\\d+(?:\\.\\d+)?)\\s*" + SEC + "\\s*([EeOoWw])"
  const dmsRe = new RegExp(dmsPattern, "u")
  const m = str.match(dmsRe)
  if (m) {
    const dms = (d, min, sec) => parseInt(d, 10) + parseInt(min, 10) / 60 + parseFloat(sec) / 3600
    const lat = dms(m[1], m[2], m[3]) * (/[Ss]/.test(m[4]) ? -1 : 1)
    const lng = dms(m[5], m[6], m[7]) * (/[OoWw]/.test(m[8]) ? -1 : 1)
    return { lat, lng, valid: true }
  }

  const parts = str.split(",")
  if (parts.length === 2) {
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, valid: true }
  }

  return { lat: null, lng: null, valid: false }
}
