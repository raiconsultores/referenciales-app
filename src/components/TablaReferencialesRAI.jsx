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

const IconExternal = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2.5H3C2.72 2.5 2.5 2.72 2.5 3V11C2.5 11.28 2.72 11.5 3 11.5H11C11.28 11.5 11.5 11.28 11.5 11V8" />
    <path d="M8.5 2.5H11.5V5.5" />
    <path d="M11.5 2.5L6.5 7.5" />
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

export default function TablaReferencialesRAI({ referenciales, onActualizarCoordenadas }) {
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
                <th>Tipo de Inmueble</th>
                <th>Colonia / Residencial</th>
                <th>Municipio</th>
                <th>Zona</th>
                <th className="num">Precio en Q</th>
                <th className="num">M² Terreno</th>
                <th className="num">M² Construcción</th>
                <th className="num">Q/m² Terreno</th>
                <th className="num">Q/m² Construcción</th>
                <th>Fecha</th>
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
                  <td style={{ whiteSpace: 'nowrap' }}>{r.fecha_captura || '—'}</td>
                  <td className="acciones-cell" onClick={e => e.stopPropagation()}>
                    <a
                      className="btn-icon icon-external"
                      href={googleMapsUrl(r)}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir en Google Maps"
                    ><IconExternal /></a>
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
