import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../supabaseClient'

// Guatemala City center
const GT_CENTER = [14.6349, -90.5069]
const GT_ZOOM   = 11

const FOTOS_BUCKET    = 'referenciales-rai-fotos'
const SIGNED_URL_TTL  = 60 * 60 // 1 hora

const TIPO_COLORES = {
  Casa:        '#2563eb',
  Apartamento: '#16a34a',
  Terreno:     '#ea580c',
  Comercio:    '#9333ea',
  Oficina:     '#0891b2',
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

function popupHtml(r, fotos) {
  const lines = [
    `<strong style="color:#1e40af">${r.tipo}</strong>`,
    [r.colonia, r.zona, r.municipio].filter(Boolean).join(' — '),
    `<strong>${fmtQ(r.precio_quetzales) ?? '—'}</strong>`,
    r.m2_terreno      ? `Terreno: ${r.m2_terreno} m²  →  ${fmtQ(r.precio_m2_terreno) ?? '—'}/m²` : null,
    r.m2_construccion ? `Constr.: ${r.m2_construccion} m²  →  ${fmtQ(r.precio_m2_construccion) ?? '—'}/m²` : null,
    [
      r.habitaciones != null ? `${r.habitaciones} hab.` : null,
      r.banos != null        ? `${r.banos} baños`       : null,
      r.parqueos != null     ? `${r.parqueos} parq.`    : null,
    ].filter(Boolean).join(' · ') || null,
    r.fecha_captura   ? `Fecha: ${r.fecha_captura}` : null,
  ].filter(Boolean)

  let fotosHtml = ''
  if (fotos === undefined) {
    fotosHtml = `<div style="margin-top:6px;font-size:11px;color:#94a3b8;">Cargando fotos…</div>`
  } else if (Array.isArray(fotos) && fotos.length > 0) {
    const miniaturas = fotos.slice(0, 4).map(f => `
      <a href="${f.signedUrl}" target="_blank" rel="noreferrer">
        <img src="${f.signedUrl}" loading="lazy"
             style="width:52px;height:52px;object-fit:cover;border-radius:4px;border:1px solid #e2e8f0;" />
      </a>
    `).join('')
    fotosHtml = `<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">${miniaturas}</div>`
  }

  return lines.join('<br/>') + fotosHtml
}

export default function MapaReferencialesRAI({
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
  const fotosCacheRef = useRef(new Map())
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

  // Firma estable del listado — evita reconstruir todos los pines cuando el padre
  // re-renderiza y produce un nuevo array con el mismo contenido (p. ej. al filtrar)
  const referencialesKey = useMemo(
    () => referenciales.map(r => `${r.id}:${r.lat}:${r.lng}:${r.tipo}`).join('|'),
    [referenciales]
  )

  // Update markers when data or active item changes
  useEffect(() => {
    const map = mapRef.current
    // No reconstruir mientras hay un drag pendiente de confirmar
    if (!map || pendingDrag) return

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

      marker.bindPopup(popupHtml(r, fotosCacheRef.current.get(r.id)), { maxWidth: 260 })

      marker.on('popupopen', async () => {
        if (fotosCacheRef.current.has(r.id)) return
        const { data, error } = await supabase
          .from('referenciales_rai_fotos')
          .select('path, orden')
          .eq('referencial_id', r.id)
          .order('orden', { ascending: true })
        const filas = error ? [] : (data || [])
        const firmadas = await Promise.all(
          filas.map(f => supabase.storage.from(FOTOS_BUCKET).createSignedUrl(f.path, SIGNED_URL_TTL))
        )
        const fotos = firmadas
          .map(res => (res.error ? null : { signedUrl: res.data.signedUrl }))
          .filter(Boolean)
        fotosCacheRef.current.set(r.id, fotos)
        marker.setPopupContent(popupHtml(r, fotos))
      })

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        setPendingDrag({
          id: r.id,
          label: r.direccion_original || r.colonia || 'este referencial',
          lat,
          lng,
          original: [r.lat, r.lng],
          marker: e.target,
        })
      })

      markersRef.current.push(marker)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencialesKey, referencialActivo, modoAsignar, pendingDrag])

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
          <strong>{referencialActivo?.direccion_original ?? 'referencial'}</strong>
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
