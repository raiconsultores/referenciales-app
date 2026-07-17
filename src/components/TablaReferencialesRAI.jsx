import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import DetalleReferencialRAI from './DetalleReferencialRAI'

const fmtQ = (n) =>
  n != null
    ? `Q ${parseFloat(n).toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '—'

const fmtM2 = (n) =>
  n != null ? `${parseFloat(n).toLocaleString('es-GT')} m²` : '—'

const googleMapsUrl = (r) =>
  r.lat && r.lng
    ? `https://maps.google.com/?q=${r.lat},${r.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(`${r.direccion_original}, Guatemala`)}`

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.5 2.5L11.5 4.5L4.5 11.5H2.5V9.5L9.5 2.5Z" />
    <path d="M8 4L10 6" />
  </svg>
)

const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 1.5C5.07 1.5 3.5 3.07 3.5 5C3.5 7.75 7 12.5 7 12.5C7 12.5 10.5 7.75 10.5 5C10.5 3.07 8.93 1.5 7 1.5Z" />
    <circle cx="7" cy="5" r="1.5" />
  </svg>
)

const IconExternal = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2.5H3C2.72 2.5 2.5 2.72 2.5 3V11C2.5 11.28 2.72 11.5 3 11.5H11C11.28 11.5 11.5 11.28 11.5 11V8" />
    <path d="M8.5 2.5H11.5V5.5" />
    <path d="M11.5 2.5L6.5 7.5" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 4H12" />
    <path d="M5 4V2.5H9V4" />
    <path d="M3 4L3.75 11.5H10.25L11 4" />
    <path d="M5.5 6.5V9.5" />
    <path d="M8.5 6.5V9.5" />
  </svg>
)

const IconPinFilled = () => (
  <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor" aria-hidden="true">
    <path d="M5.5 0C3.02 0 1 2.02 1 4.5C1 7.88 5.5 13 5.5 13C5.5 13 10 7.88 10 4.5C10 2.02 7.98 0 5.5 0ZM5.5 6C4.67 6 4 5.33 4 4.5C4 3.67 4.67 3 5.5 3C6.33 3 7 3.67 7 4.5C7 5.33 6.33 6 5.5 6Z" />
  </svg>
)

const IconExcel = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="1.5" width="10" height="11" rx="1" />
    <path d="M4.5 5L6 7L4.5 9" />
    <path d="M9.5 5L8 7L9.5 9" />
    <path d="M5 11.5V12.5" />
    <path d="M9 11.5V12.5" />
    <path d="M2 4.5H12" />
  </svg>
)

function exportarExcel(registros, nombreArchivo) {
  const rows = registros.map(r => ({
    'No. Avalúo':            r.no_avaluo             ?? '',
    'Fecha Captura':         r.fecha_captura          ?? '',
    'Tipo':                  r.tipo                   ?? '',
    'Dirección Original':    r.direccion_original     ?? '',
    'Calle/Avenida/Número':  r.calle_avenida_numero   ?? '',
    'Calle/Avenida':         r.calle_avenida          ?? '',
    'Número':                r.numero                 ?? '',
    'Zona':                  r.zona                   ?? '',
    'Colonia':                r.colonia                ?? '',
    'Municipio':             r.municipio              ?? '',
    'Departamento':          r.departamento           ?? '',
    'Latitud':               r.lat                    ?? '',
    'Longitud':              r.lng                    ?? '',
    'm² Terreno':            r.m2_terreno             ?? '',
    'm² Construcción':       r.m2_construccion        ?? '',
    'Habitaciones':          r.habitaciones           ?? '',
    'Baños':                 r.banos                  ?? '',
    'Parqueos':              r.parqueos               ?? '',
    'Antigüedad (años)':     r.antiguedad             ?? '',
    'Estado Conservación':   r.estado_conservacion    ?? '',
    'Moneda':                r.moneda                 ?? '',
    'Precio Original':       r.precio_original        ?? '',
    'Tipo de Cambio':        r.tipo_cambio            ?? '',
    'Precio (Q)':            r.precio_quetzales       ?? '',
    'Q/m² Terreno':          r.precio_m2_terreno      ?? '',
    'Q/m² Construcción':     r.precio_m2_construccion ?? '',
    'Fuente':                r.fuente                 ?? '',
    'Contacto':              r.contacto               ?? '',
    'URL':                   r.url                    ?? '',
    'Observaciones':         r.observaciones          ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Referenciales RAI')
  XLSX.writeFile(wb, nombreArchivo)
}

export default function TablaReferencialesRAI({ referenciales, onEditar, onEliminar, onAsignarCoordenadas, onActualizarCoordenadas }) {
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [detalleRef, setDetalleRef]       = useState(null)

  useEffect(() => { setSeleccionados(new Set()) }, [referenciales])

  useEffect(() => {
    if (!detalleRef) return
    const actualizado = referenciales.find(r => r.id === detalleRef.id)
    if (actualizado) setDetalleRef(actualizado)
  }, [referenciales])

  const todosSeleccionados = referenciales.length > 0 &&
    referenciales.every(r => seleccionados.has(r.id))
  const algunoSeleccionado = seleccionados.size > 0

  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(referenciales.map(r => r.id)))
    }
  }

  const toggleUno = (id) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleExportar = () => {
    const lista = algunoSeleccionado
      ? referenciales.filter(r => seleccionados.has(r.id))
      : referenciales
    const sufijo = algunoSeleccionado ? `_${lista.length}-seleccionados` : `_todos-${lista.length}`
    exportarExcel(lista, `referenciales_rai${sufijo}.xlsx`)
  }

  if (referenciales.length === 0) {
    return (
      <div className="tabla-vacia">
        No hay referenciales RAI que coincidan con los filtros actuales.
      </div>
    )
  }

  return (
    <>
      <div className="tabla-container">
        <div className="tabla-meta">
          <span>{referenciales.length} referencial{referenciales.length !== 1 ? 'es' : ''}</span>
          <button onClick={handleExportar} className="btn-excel">
            <IconExcel />
            {algunoSeleccionado
              ? `Exportar Excel (${seleccionados.size})`
              : `Exportar Excel (${referenciales.length})`}
          </button>
        </div>

        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={toggleTodos}
                    title={todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  />
                </th>
                <th>Tipo</th>
                <th>Colonia</th>
                <th>Municipio</th>
                <th>Zona</th>
                <th className="num">Precio Q</th>
                <th className="num">m² Terreno</th>
                <th className="num">m² Constr.</th>
                <th className="num">Q/m² Terreno</th>
                <th className="num">Q/m² Constr.</th>
                <th className="num">Hab.</th>
                <th className="num">Baños</th>
                <th className="num">Parq.</th>
                <th>Fecha Captura</th>
                <th>Coords</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {referenciales.map(r => (
                <tr
                  key={r.id}
                  className={`tabla-fila${seleccionados.has(r.id) ? ' fila-seleccionada' : ''}`}
                  onClick={() => setDetalleRef(r)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="col-check" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={seleccionados.has(r.id)}
                      onChange={() => toggleUno(r.id)}
                    />
                  </td>
                  <td>
                    <span className={`tipo-badge tipo-${r.tipo?.toLowerCase()}`}>
                      {r.tipo}
                    </span>
                  </td>
                  <td>{r.colonia || '—'}</td>
                  <td>{r.municipio || '—'}</td>
                  <td>{r.zona || '—'}</td>
                  <td className="num">{fmtQ(r.precio_quetzales)}</td>
                  <td className="num">{fmtM2(r.m2_terreno)}</td>
                  <td className="num">{fmtM2(r.m2_construccion)}</td>
                  <td className="num">{fmtQ(r.precio_m2_terreno)}</td>
                  <td className="num">{fmtQ(r.precio_m2_construccion)}</td>
                  <td className="num">{r.habitaciones ?? '—'}</td>
                  <td className="num">{r.banos ?? '—'}</td>
                  <td className="num">{r.parqueos ?? '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.fecha_captura || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {r.lat && r.lng
                      ? <span className="coords-ok" title={`${r.lat}, ${r.lng}`}><IconPinFilled /></span>
                      : <span className="coords-none">—</span>}
                  </td>
                  <td className="acciones-cell" onClick={e => e.stopPropagation()}>
                    <button
                      className="btn-icon icon-edit"
                      onClick={() => onEditar(r)}
                      title="Editar"
                    ><IconEdit /></button>
                    <button
                      className="btn-icon icon-location"
                      onClick={() => onAsignarCoordenadas(r)}
                      title="Asignar ubicación en mapa"
                    ><IconMapPin /></button>
                    <a
                      className="btn-icon icon-external"
                      href={googleMapsUrl(r)}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir en Google Maps"
                    ><IconExternal /></a>
                    <button
                      className="btn-icon icon-danger"
                      onClick={() => onEliminar(r.id)}
                      title="Eliminar"
                    ><IconTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detalleRef && (
        <DetalleReferencialRAI
          referencial={detalleRef}
          onCerrar={() => setDetalleRef(null)}
          onActualizarCoordenadas={onActualizarCoordenadas}
        />
      )}
    </>
  )
}
