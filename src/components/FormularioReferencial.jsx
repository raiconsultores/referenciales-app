import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { inferirDeptMunicipio, extractZonaLimpia } from '../utils/geoUtils'
import { geocodificarDireccion } from '../utils/geocode'
import { parseCoords } from '../utils/coords'

const TIPOS = ['Casa', 'Apartamento', 'Terreno']

const EMPTY = {
  tipo:            'Casa',
  descripcion:     '',
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

export default function FormularioReferencial({ referencial, onGuardar, onCancelar }) {
  const [form, setForm]             = useState(EMPTY)
  const [coordInput, setCoordInput] = useState('')
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState(null)
  const [buscandoCoords, setBuscandoCoords] = useState(false)
  const [geoError, setGeoError]             = useState(null)

  useEffect(() => {
    if (referencial) {
      const lat = referencial.lat ?? ''
      const lng = referencial.lng ?? ''
      setForm({
        tipo:            referencial.tipo            ?? 'Casa',
        descripcion:     referencial.descripcion     ?? '',
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
    setGeoError(null)
  }, [referencial])

  const n = (v) => (v !== '' && v != null ? parseFloat(v) : null)

  const precioM2Terr  = n(form.precio_total) && n(form.m2_terreno)
    ? (n(form.precio_total) / n(form.m2_terreno)).toFixed(0)
    : null
  const precioM2Constr = n(form.precio_total) && n(form.m2_construccion)
    ? (n(form.precio_total) / n(form.m2_construccion)).toFixed(0)
    : null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Al editar descripcion, sugerir zona limpia si zona está vacía
      if (name === 'descripcion' && !prev.zona) {
        const sugerida = extractZonaLimpia(value)
        if (sugerida) next.zona = sugerida
      }
      return next
    })
  }

  const handleCoordChange = (e) => {
    const val = e.target.value
    setCoordInput(val)
    setGeoError(null)
    const { lat, lng, valid } = parseCoords(val)
    if (valid) {
      setForm(prev => ({ ...prev, lat, lng }))
    } else if (!val.trim()) {
      setForm(prev => ({ ...prev, lat: '', lng: '' }))
    }
  }

  const handleBuscarCoordenadas = async () => {
    if (!form.direccion.trim()) return
    setBuscandoCoords(true)
    setGeoError(null)
    try {
      const { departamento, municipio } = inferirDeptMunicipio(form.descripcion)
      const query = [form.direccion, municipio, departamento, 'Guatemala'].filter(Boolean).join(', ')
      const resultado = await geocodificarDireccion(query)
      if (resultado) {
        setForm(prev => ({ ...prev, lat: resultado.lat, lng: resultado.lng }))
        setCoordInput(`${resultado.lat}, ${resultado.lng}`)
      } else {
        setGeoError('No se encontró la dirección, puedes ajustar el pin manualmente')
      }
    } catch (err) {
      setGeoError(err?.message ?? 'Error al buscar la dirección')
    } finally {
      setBuscandoCoords(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const { departamento, municipio } = inferirDeptMunicipio(form.descripcion)
    const payload = {
      tipo:            form.tipo,
      descripcion:     form.descripcion.trim(),
      zona:            form.zona.trim() || null,
      direccion:       form.direccion.trim(),
      precio_total:    parseFloat(form.precio_total),
      m2_terreno:      n(form.m2_terreno),
      m2_construccion: n(form.m2_construccion),
      fecha:           form.fecha,
      lat:             n(form.lat),
      lng:             n(form.lng),
      observaciones:   form.observaciones.trim() || null,
      departamento,
      municipio,
      // precio_m2_terreno y precio_m2_construccion son columnas generadas por Postgres
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

  const { departamento: deptPreview, municipio: munPreview } = inferirDeptMunicipio(form.descripcion)

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

        {/* Zona / Km. */}
        <div className="form-group">
          <label>Zona / Km.</label>
          <input
            name="zona"
            value={form.zona}
            onChange={handleChange}
            placeholder="Zona 10"
          />
        </div>

        {/* Descripción completa */}
        <div className="form-group form-full">
          <label>Descripción completa *</label>
          <input
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            required
            placeholder="Zona 10, Ciudad de Guatemala"
          />
        </div>

        {/* Municipio + Departamento — inferidos de descripcion */}
        {(munPreview || deptPreview) && (
          <div className="form-group form-full">
            <label>Ubicación (auto)</label>
            <input
              readOnly
              value={[munPreview, deptPreview].filter(Boolean).join(', ')}
              className="input-readonly"
            />
          </div>
        )}

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
            <input readOnly value={fmtPreview(precioM2Terr)} className="input-readonly" />
          </div>
        )}

        {precioM2Constr && (
          <div className="form-group">
            <label>Q/m² Construcción (calculado)</label>
            <input readOnly value={fmtPreview(precioM2Constr)} className="input-readonly" />
          </div>
        )}

        {/* Coordenadas */}
        <div className="form-group form-full">
          <div className="coord-label-row">
            <label>Coordenadas</label>
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={handleBuscarCoordenadas}
              disabled={buscandoCoords || !form.direccion.trim()}
            >
              {buscandoCoords && <span className="spinner spinner-dark" />}
              {buscandoCoords ? 'Buscando…' : 'Buscar coordenadas'}
            </button>
          </div>
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
          {geoError && <small className="coord-error">{geoError}</small>}
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
