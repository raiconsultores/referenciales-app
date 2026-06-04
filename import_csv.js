#!/usr/bin/env node
/**
 * Importar referenciales desde CSV a Supabase.
 * Uso: node import_csv.js archivo.csv
 *
 * Columnas esperadas en el CSV (header requerido):
 *   tipo, zona, direccion, precio_total, m2_terreno, m2_construccion,
 *   fecha, lat, lng, observaciones
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'

// Carga manual de .env (sin dependencia de dotenv)
try {
  const env = readFileSync('.env', 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^=#\s][^=]*)\s*=\s*(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {
  // .env no encontrado — usar variables de entorno del sistema
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env')
  process.exit(1)
}

const archivo = process.argv[2]
if (!archivo) {
  console.error('Uso: node import_csv.js archivo.csv')
  process.exit(1)
}

let csvText
try {
  csvText = readFileSync(archivo, 'utf8')
} catch {
  console.error(`No se pudo leer el archivo: ${archivo}`)
  process.exit(1)
}

const { data: filas, errors } = Papa.parse(csvText, {
  header: true,
  skipEmptyLines: true,
  transformHeader: h => h.trim().toLowerCase(),
})

if (errors.length) {
  console.error('Errores al parsear CSV:')
  errors.forEach(e => console.error(' ', e.message))
  process.exit(1)
}

const num = (v) => (v !== undefined && v !== '' ? parseFloat(v) : null)

const registros = filas
  .map((f, i) => {
    const r = {
      tipo:            f.tipo?.trim(),
      zona:            f.zona?.trim(),
      direccion:       f.direccion?.trim(),
      precio_total:    num(f.precio_total),
      m2_terreno:      num(f.m2_terreno),
      m2_construccion: num(f.m2_construccion),
      fecha:           f.fecha?.trim(),
      lat:             num(f.lat),
      lng:             num(f.lng),
      observaciones:   f.observaciones?.trim() || null,
    }
    if (!r.tipo || !r.zona || !r.direccion || isNaN(r.precio_total) || !r.fecha) {
      console.warn(`  Fila ${i + 2} omitida (campos requeridos vacíos):`, JSON.stringify(f))
      return null
    }
    if (!['Casa', 'Apartamento', 'Terreno'].includes(r.tipo)) {
      console.warn(`  Fila ${i + 2} omitida — tipo inválido: "${r.tipo}"`)
      return null
    }
    return r
  })
  .filter(Boolean)

if (registros.length === 0) {
  console.error('No hay registros válidos para importar.')
  process.exit(1)
}

console.log(`\nImportando ${registros.length} registros válidos de ${filas.length} filas totales...\n`)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const BATCH = 50
let importados = 0

for (let i = 0; i < registros.length; i += BATCH) {
  const lote = registros.slice(i, i + BATCH)
  const { error } = await supabase.from('referenciales').insert(lote)
  if (error) {
    console.error(`\nError en lote ${i + 1}-${i + lote.length}: ${error.message}`)
    process.exit(1)
  }
  importados += lote.length
  process.stdout.write(`  ${importados}/${registros.length}\r`)
}

console.log(`\nListo. ${importados} referenciales importados correctamente.\n`)
