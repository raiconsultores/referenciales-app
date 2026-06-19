import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const TIPOS = ['Casa', 'Apartamento', 'Terreno']

const EMPTY = {
  tipo:            'Casa',
  zona:            '',
  direccion:       '',
  precio_total:    '',
  m2_terreno:      '',
  m2_construccion: '',
  fecha:           new Date().toISOString().slice(0, 10),
  lat:             '',
  lng:             '',
  observaciones:   '',
}

// Acepta decimal “14.619167, -90.614444”
// o GMS     “14°31’46.84”N, 90°25’56.74”O”  (separador: coma, espacio o ambos)
function parseCoords(str) {
  if (!str.trim()) return { lat: null, lng: null, valid: false }

  // Un componente DMS: NNN°NN’NN.NN”[NSOW]
  // ° = °   ‘ = ‘   “ = “
  const SEG  = String.raw`(\d+(?:\.\d+)?)`          // segundos (con decimales opcionales)
  const COMP = String.raw`(\d{1,3})°\s*(\d{1,2})’\s*` + SEG + String.raw`”\s*`
  const re = new RegExp(
    COMP + ‘([NSns])’ +              // latitud + dirección
    String.raw`\s*,?\s*` +           // separador: coma, espacio, o ambos
    COMP + ‘([EeOoWw])’,             // longitud + dirección
    ‘u’
  )

  const m = str.match(re)
  if (m) {
    // grupos: [1]latD [2]latM [3]latS [4]latDir [5]lngD [6]lngM [7]lngS [8]lngDir
    const dms = (d, min, sec) => parseInt(d, 10) + parseInt(min, 10) / 60 + parseFloat(sec) / 3600
    const lat = dms(m[1], m[2], m[3]) * (/[Ss]/.test(m[4]) ? -1 : 1)
    const lng = dms(m[5], m[6], m[7]) * (/[OoWw]/.test(m[8]) ? -1 : 1)
    return { lat, lng, valid: true }
  }

  // Decimal: “14.619167, -90.614444”
  const parts = str.split(‘,’)
  if (parts.length === 2) {
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng, valid: true }
  }

  return { lat: null, lng: null, valid: false }
}

export default function FormularioReferencial({ referencial, onGuardar, onCancelar }) {
  const [form, setForm]             = useState(EMPTY)
  const [coordInput, setCoordInput] = useState('')
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    if (referencial) {
      const lat = referencial.lat ?? ''
      const lng = referencial.lng ?? ''
      setForm({
        tipo:            referencial.tipo            ?? 'Casa',
        zona:            referencial.zona            ?? '',
        direccion:       referencial.direccion       ?? '',
        precio_total:    referencial.precio_total    ?? '',
        m2_terreno:      referencial.m2_terreno      ?? '',
        m2_construccion: referencial.m2_construccion ?? '',
        fecha:           referencial.fecha           ?? '',
        lat,
        lng,
        observaciones:   referencial.observaciones   ?? '',
      })
      setCoordInput(lat !== '' && lng !== '' ? `${lat}, ${lng}` : '')
    } else {
      setForm(EMPTY)
      setCoordInput('')
    }
  }, [referencial])

  const n = (v) => (v !== '' && v != null ? parseFloat(v) : null)

  // Preview calculations (same logic as the DB generated columns)
  const precioM2Terr  = n(form.precio_total) && n(form.m2_terreno)
    ? (n(form.precio_total) / n(form.m2_terreno)).toFixed(0)
    : null
  const precioM2Constr = n(form.precio_total) && n(form.m2_construccion)
    ? (n(form.precio_total) / n(form.m2_construccion)).toFixed(0)
    : null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCoordChange = (e) => {
    const val = e.target.value
    setCoordInput(val)
    const { lat, lng, valid } = parseCoords(val)
    if (valid) {
      setForm(prev => ({ ...prev, lat, lng }))
    } else if (!val.trim()) {
      setForm(prev => ({ ...prev, lat: '', lng: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const payload = {
      tipo:            form.tipo,
      zona:            form.zona.trim(),
      direccion:       form.direccion.trim(),
      precio_total:    parseFloat(form.precio_total),
      m2_terreno:      n(form.m2_terreno),
      m2_construccion: n(form.m2_construccion),
      fecha:           form.fecha,
      lat:             n(form.lat),
      lng:             n(form.lng),
      observaciones:   form.observaciones.trim() || null,
      // precio_m2_terreno y precio_m2_construccion son columnas generadas por Postgres — NO incluir
    }

    const { error: err } = referencial
      ? await supabase.from('referenciales').update(payload).eq('id', referencial.id)
      : await supabase.from('referenciales').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      onGuardar()
    }
    setGuardando(false)
  }

  const fmtPreview = (v) =>
    v ? `Q ${parseInt(v).toLocaleString('es-GT')}` : ''

  return (
    <form onSubmit={handleSubmit} className="formulario">
      <h2>{referencial ? 'Editar Referencial' : 'Nuevo Referencial'}</h2>

      <div className="form-grid">

        {/* Tipo */}
        <div className="form-group">
          <label>Tipo *</label>
          <select name="tipo" value={form.tipo} onChange={handleChange} required>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Zona */}
        <div className="form-group">
          <label>Zona *</label>
          <input
            name="zona"
            value={form.zona}
            onChange={handleChange}
            required
            placeholder="Zona 10"
          />
        </div>

        {/* Dirección */}
        <div className="form-group form-full">
          <label>Dirección *</label>
          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            required
            placeholder="15 calle 5-20, Zona 10, Guatemala"
          />
        </div>

        {/* Precio total */}
        <div className="form-group">
          <label>Precio Total (Q) *</label>
          <input
            name="precio_total"
            type="number"
            value={form.precio_total}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="500000"
          />
        </div>

        {/* Fecha */}
        <div className="form-group">
          <label>Fecha *</label>
          <input
            name="fecha"
            type="date"
            value={form.fecha}
            onChange={handleChange}
            required
          />
        </div>

        {/* m² terreno */}
        <div className="form-group">
          <label>m² Terreno</label>
          <input
            name="m2_terreno"
            type="number"
            value={form.m2_terreno}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="200"
          />
        </div>

        {/* m² construcción */}
        <div className="form-group">
          <label>m² Construcción</label>
          <input
            name="m2_construccion"
            type="number"
            value={form.m2_construccion}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="150"
          />
        </div>

        {/* Calculados (read-only preview) */}
        {precioM2Terr && (
          <div className="form-group">
            <label>Q/m² Terreno (calculado)</label>
            <input
              readOnly
              value={fmtPreview(precioM2Terr)}
              className="input-readonly"
            />
          </div>
        )}

        {precioM2Constr && (
          <div className="form-group">
            <label>Q/m² Construcción (calculado)</label>
            <input
              readOnly
              value={fmtPreview(precioM2Constr)}
              className="input-readonly"
            />
          </div>
        )}

        {/* Coordenadas */}
        <div className="form-group form-full">
          <label>Coordenadas</label>
          <input
            value={coordInput}
            onChange={handleCoordChange}
            placeholder={`14.619167, -90.614444  o  14°37'09"N 90°36'52"O`}
          />
          {form.lat !== '' && form.lng !== '' && (
            <small className="coord-preview">
              Lat: {parseFloat(form.lat).toFixed(6)} &nbsp;|&nbsp; Lng: {parseFloat(form.lng).toFixed(6)}
            </small>
          )}
          {coordInput.trim() !== '' && form.lat === '' && (
            <small className="coord-error">Formato no reconocido</small>
          )}
        </div>

        {/* Observaciones */}
        <div className="form-group form-full">
          <label>Observaciones</label>
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            rows={3}
            placeholder="Detalles adicionales de la propiedad…"
          />
        </div>

      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="form-actions">
        <button type="button" onClick={onCancelar} className="btn btn-ghost">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="btn btn-primary">
          {guardando ? 'Guardando…' : referencial ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
