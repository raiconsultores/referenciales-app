import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { geocodificarDireccion } from '../utils/geocode'
import GeocodeResultsPicker from './GeocodeResultsPicker'
import FotosReferencialRAI from './FotosReferencialRAI'

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

const calleAvenidaNumero = (r) =>
  r.calle_avenida_numero || [r.calle_avenida, r.numero].filter(Boolean).join(', ') || null

const monedaPrecioOriginal = (r) => {
  if (r.precio_original == null) return null
  const monto = r.moneda === 'USD'
    ? `$ ${parseFloat(r.precio_original).toLocaleString('en-US')}`
    : `Q ${parseFloat(r.precio_original).toLocaleString('es-GT', { maximumFractionDigits: 0 })}`
  return r.moneda ? `${r.moneda} ${monto}` : monto
}

function Campo({ label, value, full }) {
  return (
    <div className={`detalle-campo${full ? ' detalle-campo-full' : ''}`}>
      <span className="detalle-label">{label}</span>
      <span className="detalle-value">{value || '—'}</span>
    </div>
  )
}

export default function DetalleReferencialRAI({ referencial: r, onCerrar, onActualizarCoordenadas }) {
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
  const [candidatos, setCandidatos]         = useState([])

  // Reiniciar el estado local al abrir un referencial distinto
  useEffect(() => {
    setPin(r?.lat != null && r?.lng != null ? [r.lat, r.lng] : null)
    setGuardando(false)
    setGuardado(false)
    setErrorGuardar(null)
    setBuscandoCoords(false)
    setGeoError(null)
    setCandidatos([])
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

  const aplicarResultado = (resultado) => {
    setPin([resultado.lat, resultado.lng])
    setGuardado(false)
    setCandidatos([])
  }

  const handleBuscarAutomatico = async () => {
    setBuscandoCoords(true)
    setGeoError(null)
    try {
      const query = [r.direccion_original, r.colonia, r.municipio, r.departamento, 'Guatemala'].filter(Boolean).join(', ')
      const resultados = await geocodificarDireccion(query)
      if (resultados.length === 0) {
        setGeoError('No se encontró la dirección, puedes ajustar el pin manualmente')
      } else if (resultados.length === 1) {
        aplicarResultado(resultados[0])
      } else {
        setCandidatos(resultados)
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
    <>
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="modal-content detalle-modal">

        <div className="detalle-header">
          <div className="detalle-header-left">
            <span className={`tipo-badge tipo-${r.tipo?.toLowerCase()}`}>{r.tipo}</span>
            <h2 className="detalle-titulo">{r.colonia || r.direccion_original || 'Referencial RAI'}</h2>
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
          <Campo label="No. de Avalúo Vinculado"    value={r.no_avaluo} full />
          <Campo label="Dirección Original Completa" value={r.direccion_original} full />
          <Campo label="Calle/Avenida, Número"      value={calleAvenidaNumero(r)} />
          <Campo label="Departamento"                value={r.departamento} />
          <Campo label="Habitaciones"                value={r.habitaciones} />
          <Campo label="Baños"                       value={r.banos} />
          <Campo label="Parqueos"                     value={r.parqueos} />
          <Campo label="Antigüedad"                  value={r.antiguedad != null ? `${r.antiguedad} años` : null} />
          <Campo label="Estado de Conservación"      value={r.estado_conservacion} />
          <Campo label="Moneda y Precio Original"    value={monedaPrecioOriginal(r)} />
          {r.moneda === 'USD' && <Campo label="Tipo de Cambio" value={r.tipo_cambio} />}
          <Campo label="Fuente"    value={r.fuente} />
          <Campo label="Contacto / Teléfono" value={r.contacto} />
          {r.url && (
            <div className="detalle-campo detalle-campo-full">
              <span className="detalle-label">URL / Referencia</span>
              <a className="detalle-value" href={r.url} target="_blank" rel="noreferrer">{r.url}</a>
            </div>
          )}
          {r.observaciones && (
            <Campo label="Observaciones" value={r.observaciones} full />
          )}

          <div className="detalle-campo detalle-campo-full">
            <span className="detalle-label">Fotos</span>
            <FotosReferencialRAI referencialId={r.id} key={r.id} />
          </div>
        </div>

      </div>
    </div>
    {candidatos.length > 0 && (
      <GeocodeResultsPicker
        resultados={candidatos}
        onSeleccionar={aplicarResultado}
        onCancelar={() => setCandidatos([])}
      />
    )}
    </>
  )
}
