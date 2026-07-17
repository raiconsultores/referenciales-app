import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { inferirDeptMunicipio } from '../utils/geoUtils'
import { geocodificarDireccion } from '../utils/geocode'
import { parseCoords } from '../utils/coords'

const TIPOS = ['Casa', 'Apartamento', 'Terreno', 'Comercio', 'Oficina']
const ESTADOS = ['Excelente', 'Bueno', 'Regular', 'Malo']

const EMPTY = {
  no_avaluo:            '',
  fecha_captura:        '',
  tipo:                 'Casa',
  direccion_original:   '',
  calle_avenida_numero: '',
  calle_avenida:        '',
  numero:               '',
  zona:                 '',
  colonia:              '',
  municipio:            '',
  departamento:         '',
  lat:                  '',
  lng:                  '',
  m2_terreno:           '',
  m2_construccion:      '',
  habitaciones:         '',
  banos:                '',
  parqueos:             '',
  antiguedad:           '',
  estado_conservacion:  '',
  moneda:               'GTQ',
  precio_original:      '',
  tipo_cambio:          '',
  fuente:               '',
  contacto:             '',
  url:                  '',
  observaciones:        '',
}

export default function FormularioReferencialRAI({ referencial, onGuardar, onCancelar }) {
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
        no_avaluo:            referencial.no_avaluo            ?? '',
        fecha_captura:        referencial.fecha_captura        ?? '',
        tipo:                 referencial.tipo                 ?? 'Casa',
        direccion_original:   referencial.direccion_original   ?? '',
        calle_avenida_numero: referencial.calle_avenida_numero ?? '',
        calle_avenida:        referencial.calle_avenida        ?? '',
        numero:               referencial.numero               ?? '',
        zona:                 referencial.zona                 ?? '',
        colonia:              referencial.colonia              ?? '',
        municipio:            referencial.municipio            ?? '',
        departamento:         referencial.departamento         ?? '',
        lat, lng,
        m2_terreno:           referencial.m2_terreno           ?? '',
        m2_construccion:      referencial.m2_construccion      ?? '',
        habitaciones:         referencial.habitaciones         ?? '',
        banos:                referencial.banos                ?? '',
        parqueos:             referencial.parqueos             ?? '',
        antiguedad:           referencial.antiguedad           ?? '',
        estado_conservacion:  referencial.estado_conservacion  ?? '',
        moneda:               referencial.moneda               ?? 'GTQ',
        precio_original:      referencial.precio_original      ?? '',
        tipo_cambio:          referencial.tipo_cambio          ?? '',
        fuente:               referencial.fuente                ?? '',
        contacto:             referencial.contacto             ?? '',
        url:                  referencial.url                  ?? '',
        observaciones:        referencial.observaciones        ?? '',
      })
      setCoordInput(lat !== '' && lng !== '' ? `${lat}, ${lng}` : '')
    } else {
      setForm(EMPTY)
      setCoordInput('')
    }
    setGeoError(null)
  }, [referencial])

  const n = (v) => (v !== '' && v != null ? parseFloat(v) : null)
  const i = (v) => (v !== '' && v != null ? parseInt(v, 10) : null)

  const precioQuetzales = form.moneda === 'USD'
    ? (n(form.precio_original) != null && n(form.tipo_cambio) != null
        ? n(form.precio_original) * n(form.tipo_cambio)
        : null)
    : n(form.precio_original)

  const precioM2Terr   = precioQuetzales && n(form.m2_terreno)
    ? (precioQuetzales / n(form.m2_terreno)).toFixed(0)
    : null
  const precioM2Constr = precioQuetzales && n(form.m2_construccion)
    ? (precioQuetzales / n(form.m2_construccion)).toFixed(0)
    : null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      // Al escribir la dirección, sugerir departamento/municipio si están vacíos
      if (name === 'direccion_original' && !prev.departamento && !prev.municipio) {
        const { departamento, municipio } = inferirDeptMunicipio(value)
        if (departamento) next.departamento = departamento
        if (municipio) next.municipio = municipio
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
    if (!form.direccion_original.trim()) return
    setBuscandoCoords(true)
    setGeoError(null)
    try {
      const query = [form.direccion_original, form.colonia, form.municipio, form.departamento, 'Guatemala']
        .filter(Boolean).join(', ')
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

    const payload = {
      no_avaluo:            form.no_avaluo.trim() || null,
      fecha_captura:        form.fecha_captura || null,
      tipo:                 form.tipo,
      direccion_original:   form.direccion_original.trim(),
      calle_avenida_numero: form.calle_avenida_numero.trim() || null,
      calle_avenida:        form.calle_avenida.trim() || null,
      numero:               form.numero.trim() || null,
      zona:                 form.zona.trim() || null,
      colonia:              form.colonia.trim() || null,
      municipio:            form.municipio.trim() || null,
      departamento:         form.departamento.trim() || null,
      lat:                  n(form.lat),
      lng:                  n(form.lng),
      m2_terreno:           n(form.m2_terreno),
      m2_construccion:      n(form.m2_construccion),
      habitaciones:         i(form.habitaciones),
      banos:                i(form.banos),
      parqueos:             i(form.parqueos),
      antiguedad:           i(form.antiguedad),
      estado_conservacion:  form.estado_conservacion || null,
      moneda:               form.moneda || null,
      precio_original:      n(form.precio_original),
      tipo_cambio:          form.moneda === 'USD' ? n(form.tipo_cambio) : null,
      precio_quetzales:     precioQuetzales,
      fuente:               form.fuente.trim() || null,
      contacto:             form.contacto.trim() || null,
      url:                  form.url.trim() || null,
      observaciones:        form.observaciones.trim() || null,
      // precio_m2_terreno y precio_m2_construccion son columnas generadas por Postgres
    }

    const { error: err } = referencial
      ? await supabase.from('referenciales_rai').update(payload).eq('id', referencial.id)
      : await supabase.from('referenciales_rai').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      onGuardar()
    }
    setGuardando(false)
  }

  const fmtPreview = (v) => v ? `Q ${parseInt(v).toLocaleString('es-GT')}` : ''

  return (
    <form onSubmit={handleSubmit} className="formulario">
      <h2>{referencial ? 'Editar Referencial RAI' : 'Nuevo Referencial RAI'}</h2>

      <div className="form-grid">

        {/* Tipo + No. Avalúo */}
        <div className="form-group">
          <label>Tipo *</label>
          <select name="tipo" value={form.tipo} onChange={handleChange} required>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>No. Avalúo</label>
          <input name="no_avaluo" value={form.no_avaluo} onChange={handleChange} placeholder="A-1234" />
        </div>

        {/* Fecha de captura */}
        <div className="form-group">
          <label>Fecha de Captura</label>
          <input name="fecha_captura" type="date" value={form.fecha_captura} onChange={handleChange} />
        </div>

        {/* Dirección original */}
        <div className="form-group form-full">
          <label>Dirección Original *</label>
          <input
            name="direccion_original"
            value={form.direccion_original}
            onChange={handleChange}
            required
            placeholder="15 calle 5-20, Zona 10, Guatemala"
          />
        </div>

        {/* Calle/avenida desglosada */}
        <div className="form-group">
          <label>Calle/Avenida</label>
          <input name="calle_avenida" value={form.calle_avenida} onChange={handleChange} placeholder="15 calle" />
        </div>
        <div className="form-group">
          <label>Número</label>
          <input name="numero" value={form.numero} onChange={handleChange} placeholder="5-20" />
        </div>
        <div className="form-group form-full">
          <label>Calle/Avenida/Número (combinado)</label>
          <input name="calle_avenida_numero" value={form.calle_avenida_numero} onChange={handleChange} placeholder="15 calle 5-20" />
        </div>

        {/* Zona / Colonia */}
        <div className="form-group">
          <label>Zona</label>
          <input name="zona" value={form.zona} onChange={handleChange} placeholder="Zona 10" />
        </div>
        <div className="form-group">
          <label>Colonia / Residencial</label>
          <input name="colonia" value={form.colonia} onChange={handleChange} placeholder="Colonia, residencial, aldea, edificio…" />
        </div>

        {/* Departamento / Municipio */}
        <div className="form-group">
          <label>Departamento</label>
          <input name="departamento" value={form.departamento} onChange={handleChange} placeholder="Guatemala" />
        </div>
        <div className="form-group">
          <label>Municipio</label>
          <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Ciudad de Guatemala" />
        </div>

        {/* m² */}
        <div className="form-group">
          <label>m² Terreno</label>
          <input name="m2_terreno" type="number" value={form.m2_terreno} onChange={handleChange} min="0" step="0.01" placeholder="200" />
        </div>
        <div className="form-group">
          <label>m² Construcción</label>
          <input name="m2_construccion" type="number" value={form.m2_construccion} onChange={handleChange} min="0" step="0.01" placeholder="150" />
        </div>

        {/* Habitaciones / Baños / Parqueos / Antigüedad */}
        <div className="form-group">
          <label>Habitaciones</label>
          <input name="habitaciones" type="number" value={form.habitaciones} onChange={handleChange} min="0" step="1" />
        </div>
        <div className="form-group">
          <label>Baños</label>
          <input name="banos" type="number" value={form.banos} onChange={handleChange} min="0" step="1" />
        </div>
        <div className="form-group">
          <label>Parqueos</label>
          <input name="parqueos" type="number" value={form.parqueos} onChange={handleChange} min="0" step="1" />
        </div>
        <div className="form-group">
          <label>Antigüedad (años)</label>
          <input name="antiguedad" type="number" value={form.antiguedad} onChange={handleChange} min="0" step="1" />
        </div>

        {/* Estado de conservación */}
        <div className="form-group">
          <label>Estado de Conservación</label>
          <select name="estado_conservacion" value={form.estado_conservacion} onChange={handleChange}>
            <option value="">Sin especificar</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Moneda / Precio / Tipo de cambio */}
        <div className="form-group">
          <label>Moneda</label>
          <select name="moneda" value={form.moneda} onChange={handleChange}>
            <option value="GTQ">GTQ (Quetzales)</option>
            <option value="USD">USD (Dólares)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Precio Original *</label>
          <input
            name="precio_original"
            type="number"
            value={form.precio_original}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder={form.moneda === 'USD' ? '65000' : '500000'}
          />
        </div>
        {form.moneda === 'USD' && (
          <div className="form-group">
            <label>Tipo de Cambio (Q por $1)</label>
            <input name="tipo_cambio" type="number" value={form.tipo_cambio} onChange={handleChange} min="0" step="0.0001" placeholder="7.75" />
          </div>
        )}

        {/* Calculados (read-only preview) */}
        {precioQuetzales != null && (
          <div className="form-group">
            <label>Precio en Quetzales (calculado)</label>
            <input readOnly value={fmtPreview(precioQuetzales)} className="input-readonly" />
          </div>
        )}
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
              disabled={buscandoCoords || !form.direccion_original.trim()}
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

        {/* Fuente / Contacto / URL */}
        <div className="form-group">
          <label>Fuente</label>
          <input name="fuente" value={form.fuente} onChange={handleChange} placeholder="Publicación, corredor, etc." />
        </div>
        <div className="form-group">
          <label>Contacto</label>
          <input name="contacto" value={form.contacto} onChange={handleChange} />
        </div>
        <div className="form-group form-full">
          <label>URL</label>
          <input name="url" type="url" value={form.url} onChange={handleChange} placeholder="https://…" />
        </div>

        {/* Observaciones */}
        <div className="form-group form-full">
          <label>Observaciones</label>
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            rows={3}
            placeholder="Detalles adicionales…"
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
