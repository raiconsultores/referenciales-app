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

export default function FormularioReferencial({ referencial, onGuardar, onCancelar }) {
  const [form, setForm]         = useState(EMPTY)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (referencial) {
      setForm({
        tipo:            referencial.tipo            ?? 'Casa',
        zona:            referencial.zona            ?? '',
        direccion:       referencial.direccion       ?? '',
        precio_total:    referencial.precio_total    ?? '',
        m2_terreno:      referencial.m2_terreno      ?? '',
        m2_construccion: referencial.m2_construccion ?? '',
        fecha:           referencial.fecha           ?? '',
        lat:             referencial.lat             ?? '',
        lng:             referencial.lng             ?? '',
        observaciones:   referencial.observaciones   ?? '',
      })
    } else {
      setForm(EMPTY)
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
        <div className="form-group">
          <label>Latitud</label>
          <input
            name="lat"
            type="number"
            value={form.lat}
            onChange={handleChange}
            step="any"
            placeholder="14.6349"
          />
        </div>

        <div className="form-group">
          <label>Longitud</label>
          <input
            name="lng"
            type="number"
            value={form.lng}
            onChange={handleChange}
            step="any"
            placeholder="-90.5069"
          />
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
