import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { geocodificarDireccion } from '../utils/geocode'

const GT_CENTER  = [14.6349, -90.5069]
const ZOOM_GUIA  = 12
const ZOOM_PIN   = 16

// Ícono propio en vez del marcador por defecto de Leaflet (sus PNG no resuelven bien con Vite)
function pinIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;
      background:#1e40af;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,.45);
    "></div>`,
    iconSize:   [18, 18],
    iconAnchor: [9, 9],
  })
}

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

export default function DetalleReferencial({ referencial: r, onCerrar, onActualizarCoordenadas }) {
  const mapDivRef   = useRef(null)
  const mapInstance = useRef(null)
  const markerRef   = useRef(null)

  const [pin, setPin]                   = useState(
    r?.lat != null && r?.lng != null ? [r.lat, r.lng] : null
  )
  const [guardando, setGuardando]       = useState(false)
  const [guardado, setGuardado]         = useState(false)
  const [errorGuardar, setErrorGuardar] = useState(null)
  const [buscandoCoords, setBuscandoCoords] = useState(false)
  const [geoError, setGeoError]             = useState(null)

  // Reiniciar el estado local al abrir un referencial distinto
  useEffect(() => {
    setPin(r?.lat != null && r?.lng != null ? [r.lat, r.lng] : null)
    setGuardando(false)
    setGuardado(false)
    setErrorGuardar(null)
    setBuscandoCoords(false)
    setGeoError(null)
  }, [r?.id])

  // Crear el mapa una vez por referencial abierto
  useEffect(() => {
    if (!mapDivRef.current) return

    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
      markerRef.current = null
    }

    const map = L.map(mapDivRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    const inicial = r?.lat != null && r?.lng != null ? [r.lat, r.lng] : null
    map.setView(inicial ?? GT_CENTER, inicial ? ZOOM_PIN : ZOOM_GUIA)

    map.on('click', (e) => {
      setPin([e.latlng.lat, e.latlng.lng])
      setGuardado(false)
    })

    mapInstance.current = map
    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?.id])

  // Mantener el marcador sincronizado con la posición del pin
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    if (!pin) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(pin)
    } else {
      const marker = L.marker(pin, { icon: pinIcon(), draggable: true, autoPan: true }).addTo(map)
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        setPin([lat, lng])
        setGuardado(false)
      })
      markerRef.current = marker
      map.setView(pin, Math.max(map.getZoom(), ZOOM_PIN))
    }
  }, [pin])

  if (!r) return null

  const original   = r.lat != null && r.lng != null ? [r.lat, r.lng] : null
  const haCambiado = !!pin && (!original || pin[0] !== original[0] || pin[1] !== original[1])

  const handleBuscarAutomatico = async () => {
    setBuscandoCoords(true)
    setGeoError(null)
    try {
      const query = [r.direccion, r.municipio, r.departamento, 'Guatemala'].filter(Boolean).join(', ')
      const resultado = await geocodificarDireccion(query)
      if (resultado) {
        setPin([resultado.lat, resultado.lng])
        setGuardado(false)
      } else {
        setGeoError('No se encontró la dirección, puedes ajustar el pin manualmente')
      }
    } catch (err) {
      setGeoError(err?.message ?? 'Error al buscar la dirección')
    } finally {
      setBuscandoCoords(false)
    }
  }

  const handleGuardarUbicacion = async () => {
    if (!pin) return
    setGuardando(true)
    setErrorGuardar(null)
    try {
      await onActualizarCoordenadas(r.id, pin[0], pin[1])
      setGuardado(true)
    } catch (err) {
      setErrorGuardar(err?.message ?? 'Error al guardar la ubicación')
    } finally {
      setGuardando(false)
    }
  }

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

        <div className="detalle-mapa-wrapper">
          <div className="detalle-mapa" ref={mapDivRef} />
          {!pin && (
            <div className="detalle-mapa-hint">Haz clic en el mapa para asignar ubicación</div>
          )}
        </div>

        <div className="detalle-mapa-acciones">
          {pin ? (
            <>
              <span className="detalle-mapa-coords">{pin[0].toFixed(6)}, {pin[1].toFixed(6)}</span>
              {haCambiado ? (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleGuardarUbicacion}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando…' : 'Guardar ubicación'}
                </button>
              ) : guardado && (
                <span className="detalle-mapa-ok">✓ Ubicación guardada</span>
              )}
            </>
          ) : (
            <button
              className="btn btn-sm btn-outline"
              onClick={handleBuscarAutomatico}
              disabled={buscandoCoords}
            >
              {buscandoCoords && <span className="spinner spinner-dark" />}
              {buscandoCoords ? 'Buscando…' : 'Buscar coordenadas automáticamente'}
            </button>
          )}
        </div>
        {errorGuardar && <div className="form-error">{errorGuardar}</div>}
        {geoError && <div className="form-error">{geoError}</div>}

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
          {pin && (
            <Campo label="Coordenadas" value={`${pin[0]}, ${pin[1]}`} />
          )}
          {r.observaciones && (
            <Campo label="Observaciones" value={r.observaciones} full />
          )}
        </div>

      </div>
    </div>
  )
}
