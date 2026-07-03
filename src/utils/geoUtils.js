/**
 * Extrae zona limpia de una descripción completa.
 * Ejemplos: "Zona 16" de "Zona 16, Ciudad de Guatemala"
 *           "Km. 17.5" de "km. 17.5 Carretera a El Salvador"
 */
export function extractZonaLimpia(descripcion) {
  if (!descripcion) return null
  const kmMatch = descripcion.match(/km\.?\s+(\d+(?:[.,]\d+)?)/i)
  if (kmMatch) return `Km. ${kmMatch[1].replace(',', '.')}`
  const zonaMatch = descripcion.match(/zona\s+(\d+)/i)
  if (zonaMatch) return `Zona ${zonaMatch[1]}`
  return null
}

/**
 * Infiere departamento y municipio a partir de la descripción completa.
 * Retorna { departamento, municipio } — ambos pueden ser null si no hay match.
 */
export function inferirDeptMunicipio(zona) {
  if (!zona) return { departamento: null, municipio: null }
  const z = zona.toLowerCase()

  // --- Guatemala: municipios nombrados (antes que la regla de zona numérica) ---

  if (z.includes('san juan sacatep') || z.includes('ciudad quetzal')) {
    return { departamento: 'Guatemala', municipio: 'San Juan Sacatepéquez' }
  }
  if (z.includes('mixco')) {
    return { departamento: 'Guatemala', municipio: 'Mixco' }
  }
  if (z.includes('villa nueva') || z.includes('villanueva')) {
    return { departamento: 'Guatemala', municipio: 'Villa Nueva' }
  }
  if (z.includes('san miguel petapa') || z.includes('petapa')) {
    return { departamento: 'Guatemala', municipio: 'San Miguel Petapa' }
  }
  if (z.includes('villa canales')) {
    return { departamento: 'Guatemala', municipio: 'Villa Canales' }
  }
  if (z.includes('santa catarina pinula')) {
    return { departamento: 'Guatemala', municipio: 'Santa Catarina Pinula' }
  }
  if (z.includes('san jos') && z.includes('pinula')) {
    return { departamento: 'Guatemala', municipio: 'San José Pinula' }
  }
  if (z.includes('fraijanes')) {
    return { departamento: 'Guatemala', municipio: 'Fraijanes' }
  }
  if (z.includes('amatitl')) {
    return { departamento: 'Guatemala', municipio: 'Amatitlán' }
  }

  // Zona numérica → Ciudad de Guatemala
  if (/zona\s+\d+/.test(z)) {
    return { departamento: 'Guatemala', municipio: 'Ciudad de Guatemala' }
  }

  // --- Quetzaltenango ---
  if (z.includes('coatepeque')) {
    return { departamento: 'Quetzaltenango', municipio: 'Coatepeque' }
  }
  if (z.includes('quetzaltenango') || z.includes('xela')) {
    if (z.includes('colomba')) return { departamento: 'Quetzaltenango', municipio: 'Colomba Costa Cuca' }
    if (z.includes('san mateo')) return { departamento: 'Quetzaltenango', municipio: 'San Mateo' }
    return { departamento: 'Quetzaltenango', municipio: 'Quetzaltenango' }
  }

  // --- Alta Verapaz ---
  if (z.includes('alta verapaz') || z.includes('coban') || z.includes('cobán')) {
    if (z.includes('carch')) return { departamento: 'Alta Verapaz', municipio: 'San Pedro Carchá' }
    return { departamento: 'Alta Verapaz', municipio: 'Cobán' }
  }

  // --- Sacatepéquez ---
  if (z.includes('sacatep') || z.includes('antigua')) {
    if (z.includes('san lucas')) return { departamento: 'Sacatepéquez', municipio: 'San Lucas Sacatepéquez' }
    if (z.includes('santa luc') && z.includes('milpas')) {
      return { departamento: 'Sacatepéquez', municipio: 'Santa Lucía Milpas Altas' }
    }
    return { departamento: 'Sacatepéquez', municipio: 'Antigua Guatemala' }
  }

  // --- Chimaltenango ---
  if (z.includes('chimaltenango')) {
    return { departamento: 'Chimaltenango', municipio: null }
  }

  // --- Escuintla ---
  if (z.includes('escuintla') || z.includes('palin') || z.includes('palín') || z.includes('tiquisate')) {
    if (z.includes('palin') || z.includes('palín')) return { departamento: 'Escuintla', municipio: 'Palín' }
    if (z.includes('tiquisate')) return { departamento: 'Escuintla', municipio: 'Tiquisate' }
    return { departamento: 'Escuintla', municipio: 'Escuintla' }
  }

  // --- Santa Rosa ---
  // chiquimulilla primero para no confundir con Chiquimula (departamento)
  if (z.includes('chiquimulilla')) {
    return { departamento: 'Santa Rosa', municipio: 'Chiquimulilla' }
  }
  if (z.includes('santa rosa') || z.includes('cuilapa') || z.includes('taxisco') || z.includes('oratorio')) {
    if (z.includes('cuilapa'))  return { departamento: 'Santa Rosa', municipio: 'Cuilapa' }
    if (z.includes('taxisco'))  return { departamento: 'Santa Rosa', municipio: 'Taxisco' }
    if (z.includes('oratorio')) return { departamento: 'Santa Rosa', municipio: 'Oratorio' }
    return { departamento: 'Santa Rosa', municipio: null }
  }

  // --- Zacapa ---
  if (z.includes('zacapa')) {
    return { departamento: 'Zacapa', municipio: null }
  }

  // --- Chiquimula ---
  if (z.includes('esquipulas')) {
    return { departamento: 'Chiquimula', municipio: 'Esquipulas' }
  }
  if (z.includes('chiquimula')) {
    return { departamento: 'Chiquimula', municipio: 'Chiquimula' }
  }

  // --- Huehuetenango ---
  if (z.includes('huehuetenango')) {
    return { departamento: 'Huehuetenango', municipio: null }
  }

  // --- Retalhuleu ---
  if (z.includes('retalhuleu')) {
    return { departamento: 'Retalhuleu', municipio: null }
  }

  // --- Suchitepéquez ---
  if (z.includes('mazatenango')) {
    return { departamento: 'Suchitepéquez', municipio: 'Mazatenango' }
  }
  if (z.includes('suchitep')) {
    return { departamento: 'Suchitepéquez', municipio: null }
  }

  // --- Petén ---
  if (z.includes('flores')) {
    return { departamento: 'Petén', municipio: 'Flores' }
  }
  if (z.includes('san benito')) {
    return { departamento: 'Petén', municipio: 'San Benito' }
  }
  if (z.includes('peten') || z.includes('petén')) {
    return { departamento: 'Petén', municipio: null }
  }

  return { departamento: null, municipio: null }
}
