import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Guatemala City center
const GT_CENTER = [14.6349, -90.5069]
const GT_ZOOM   = 11

const TIPO_COLORES = {
  Casa:        '#2563eb',
  Apartamento: '#16a34a',
  Terreno:     '#ea580c',
}

function makeIcon(tipo, activo = false) {
  const color = TIPO_COLORES[tipo] ?? '#6b7280'
  const s = activo ? 18 : 11
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${s}px;height:${s}px;
      background:${color};
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,.45);
      transition:transform .1s;
    "></div>`,
    iconSize:    [s, s],
    iconAnchor:  [s / 2, s / 2],
    popupAnchor: [0, -(s / 2) - 3],
  })
}

const fmtQ = (n) =>
  n != null
    ? `Q ${Math.round(n).toLocaleString('es-GT')}`
    : null

export default function MapaReferenciales({
  referenciales,
  modoAsignar,
  referencialActivo,
  onMapaClick,
  onCancelarAsignar,
  onActualizarCoordenadas,
}) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const [pendingDrag, setPendingDrag] = useState(null)

  // Initialize map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = L.map(containerRef.current, { center: GT_CENTER, zoom: GT_ZOOM })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Map click handler — depends on modoAsignar
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const handler = (e) => {
      if (modoAsignar) onMapaClick(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handler)
    map.getContainer().style.cursor = modoAsignar ? 'crosshair' : ''
    return () => { map.off('click', handler) }
  }, [modoAsignar, onMapaClick])

  // Update markers when data or active item changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    referenciales.forEach(r => {
      if (r.lat == null || r.lng == null) return
      const activo = referencialActivo?.id === r.id
      const marker = L.marker([r.lat, r.lng], {
        icon: makeIcon(r.tipo, activo),
        draggable: !modoAsignar,
        autoPan: true,
      }).addTo(map)

      const lines = [
        `<strong style="color:#1e40af">${r.tipo}</strong>`,
        `<strong>${r.zona}</strong> — ${r.direccion}`,
        `<strong>${fmtQ(r.precio_total) ?? '—'}</strong>`,
        r.m2_terreno      ? `Terreno: ${r.m2_terreno} m²  →  ${fmtQ(r.precio_m2_terreno) ?? '—'}/m²` : null,
        r.m2_construccion ? `Constr.: ${r.m2_construccion} m²  →  ${fmtQ(r.precio_m2_construccion) ?? '—'}/m²` : null,
        r.fecha           ? `Fecha: ${r.fecha}` : null,
        r.observaciones   ? `<em style="color:#64748b">${r.observaciones}</em>` : null,
      ].filter(Boolean)

      marker.bindPopup(lines.join('<br/>'), { maxWidth: 260 })

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        setPendingDrag({
          id: r.id,
          label: r.direccion || r.zona || 'este referencial',
          lat,
          lng,
          original: [r.lat, r.lng],
          marker: e.target,
        })
      })

      markersRef.current.push(marker)
    })
  }, [referenciales, referencialActivo, modoAsignar])

  // Fly to active referencial when assigning
  useEffect(() => {
    const map = mapRef.current
    if (!map || !referencialActivo) return
    if (referencialActivo.lat && referencialActivo.lng) {
      map.flyTo([referencialActivo.lat, referencialActivo.lng], 15, { duration: 1 })
    }
  }, [referencialActivo])

  const handleConfirmarDrag = async () => {
    if (!pendingDrag) return
    try {
      await onActualizarCoordenadas(pendingDrag.id, pendingDrag.lat, pendingDrag.lng)
    } catch (err) {
      alert('Error al actualizar coordenadas: ' + (err?.message ?? err))
      pendingDrag.marker.setLatLng(pendingDrag.original)
    }
    setPendingDrag(null)
  }

  const handleCancelarDrag = () => {
    if (pendingDrag) pendingDrag.marker.setLatLng(pendingDrag.original)
    setPendingDrag(null)
  }

  return (
    <div className="mapa-wrapper">
      {pendingDrag && (
        <div className="mapa-drag-toast">
          <span>¿Guardar nueva ubicación para <strong>{pendingDrag.label}</strong>?</span>
          <div className="mapa-drag-toast-actions">
            <button onClick={handleConfirmarDrag} className="btn btn-xs btn-primary">
              Guardar
            </button>
            <button onClick={handleCancelarDrag} className="btn btn-xs btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modoAsignar && (
        <div className="mapa-banner">
          Haz clic en el mapa para ubicar:&nbsp;
          <strong>{referencialActivo?.direccion ?? 'referencial'}</strong>
          <button
            onClick={onCancelarAsignar}
            className="btn btn-sm btn-danger"
          >
            Cancelar
          </button>
        </div>
      )}

      <div ref={containerRef} className="mapa-container" />

      <div className="mapa-leyenda">
        {Object.entries(TIPO_COLORES).map(([tipo, color]) => (
          <span key={tipo} className="leyenda-item">
            <span className="leyenda-dot" style={{ background: color }} />
            {tipo}
          </span>
        ))}
      </div>
    </div>
  )
}
