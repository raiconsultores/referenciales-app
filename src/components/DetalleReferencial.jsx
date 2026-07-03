import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const fmtQ  = (n) => n != null ? `Q ${parseFloat(n).toLocaleString('es-GT', { maximumFractionDigits: 0 })}` : '—'
const fmtM2 = (n) => n != null ? `${parseFloat(n).toLocaleString('es-GT')} m²` : '—'

function Campo({ label, value, full }) {
  return (
    <div className={`detalle-campo${full ? ' detalle-campo-full' : ''}`}>
      <span className="detalle-label">{label}</span>
      <span className="detalle-value">{value || '—'}</span>
    </div>
  )
}

export default function DetalleReferencial({ referencial: r, onCerrar }) {
  const mapDivRef   = useRef(null)
  const mapInstance = useRef(null)

  useEffect(() => {
    if (!r?.lat || !r?.lng || !mapDivRef.current) return

    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
    }

    const map = L.map(mapDivRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)
    map.setView([r.lat, r.lng], 16)
    L.circleMarker([r.lat, r.lng], {
      radius: 9,
      fillColor: '#1e40af',
      color: '#ffffff',
      weight: 2.5,
      fillOpacity: 1,
    }).addTo(map)

    mapInstance.current = map
    return () => { map.remove(); mapInstance.current = null }
  }, [r])

  if (!r) return null

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="modal-content detalle-modal">

        <div className="detalle-header">
          <div className="detalle-header-left">
            <span className={`tipo-badge tipo-${r.tipo?.toLowerCase()}`}>{r.tipo}</span>
            <h2 className="detalle-titulo">{r.zona || r.descripcion || 'Referencial'}</h2>
          </div>
          <button onClick={onCerrar} className="btn-close" aria-label="Cerrar">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M1 1L11 11M11 1L1 11"/>
            </svg>
          </button>
        </div>

        {r.lat && r.lng ? (
          <div className="detalle-mapa" ref={mapDivRef} />
        ) : (
          <div className="detalle-sin-coords">Sin coordenadas asignadas</div>
        )}

        <div className="detalle-grid">
          <Campo label="Descripción"        value={r.descripcion}         full />
          <Campo label="Dirección"          value={r.direccion}           full />
          <Campo label="Departamento"       value={r.departamento} />
          <Campo label="Municipio"          value={r.municipio} />
          <Campo label="Zona"               value={r.zona} />
          <Campo label="Fecha"              value={r.fecha} />
          <Campo label="Precio Total"       value={fmtQ(r.precio_total)} />
          <Campo label="m² Terreno"         value={fmtM2(r.m2_terreno)} />
          <Campo label="m² Construcción"    value={fmtM2(r.m2_construccion)} />
          <Campo label="Q/m² Terreno"       value={fmtQ(r.precio_m2_terreno)} />
          <Campo label="Q/m² Construcción"  value={fmtQ(r.precio_m2_construccion)} />
          {r.lat && r.lng && (
            <Campo label="Coordenadas" value={`${r.lat}, ${r.lng}`} />
          )}
          {r.observaciones && (
            <Campo label="Observaciones" value={r.observaciones} full />
          )}
        </div>

      </div>
    </div>
  )
}
