import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import TablaReferencialesRAI from './TablaReferencialesRAI'
import MapaReferencialesRAI from './MapaReferencialesRAI'
import FormularioReferencialRAI from './FormularioReferencialRAI'
import EstadisticasPanelRAI from './EstadisticasPanelRAI'
import FiltrosPanelRAI from './FiltrosPanelRAI'
import ImportarCSVRAI from './ImportarCSVRAI'

export default function SeccionRAI() {
  const [referenciales, setReferenciales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filtroTipo, setFiltroTipo]               = useState('')
  const [filtroZona, setFiltroZona]               = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState('')
  const [filtroMunicipio, setFiltroMunicipio]     = useState('')

  const [vistaActiva, setVistaActiva] = useState('tabla')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [referencialEditar, setReferencialEditar] = useState(null)
  const [mostrarImportar, setMostrarImportar] = useState(false)

  const [modoAsignarCoordenadas, setModoAsignarCoordenadas] = useState(false)
  const [referencialParaCoordenadas, setReferencialParaCoordenadas] = useState(null)

  const cargarReferenciales = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('referenciales_rai')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setReferenciales(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarReferenciales() }, [cargarReferenciales])

  const referencialesFiltrados = referenciales.filter(r => {
    const coincideTipo         = !filtroTipo         || r.tipo         === filtroTipo
    const coincideZona         = !filtroZona         || r.zona         === filtroZona
    const coincideDepartamento = !filtroDepartamento || r.departamento === filtroDepartamento
    const coincideMunicipio    = !filtroMunicipio    || r.municipio    === filtroMunicipio
    return coincideTipo && coincideZona && coincideDepartamento && coincideMunicipio
  })

  const handleMapaClick = async (lat, lng) => {
    if (!modoAsignarCoordenadas || !referencialParaCoordenadas) return
    const { error } = await supabase
      .from('referenciales_rai')
      .update({ lat, lng })
      .eq('id', referencialParaCoordenadas.id)
    if (!error) {
      await cargarReferenciales()
      setModoAsignarCoordenadas(false)
      setReferencialParaCoordenadas(null)
    }
  }

  const handleAsignarCoordenadas = (ref) => {
    setReferencialParaCoordenadas(ref)
    setModoAsignarCoordenadas(true)
    setVistaActiva('mapa')
  }

  const handleCancelarAsignar = () => {
    setModoAsignarCoordenadas(false)
    setReferencialParaCoordenadas(null)
  }

  const handleActualizarCoordenadas = async (id, lat, lng) => {
    const { error } = await supabase
      .from('referenciales_rai')
      .update({ lat, lng })
      .eq('id', id)
    if (error) throw error
    await cargarReferenciales()
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este referencial RAI? Esta acción no se puede deshacer.')) return
    const { error } = await supabase.from('referenciales_rai').delete().eq('id', id)
    if (!error) cargarReferenciales()
    else alert('Error al eliminar: ' + error.message)
  }

  const handleEditar = (ref) => {
    setReferencialEditar(ref)
    setMostrarFormulario(true)
  }

  const handleNuevo = () => {
    setReferencialEditar(null)
    setMostrarFormulario(true)
  }

  const handleGuardar = async () => {
    await cargarReferenciales()
    setMostrarFormulario(false)
    setReferencialEditar(null)
  }

  const handleCerrarFormulario = () => {
    setMostrarFormulario(false)
    setReferencialEditar(null)
  }

  return (
    <>
      <div className="toolbar-acciones">
        <button onClick={handleNuevo} className="btn btn-primary">
          + Nuevo
        </button>
        <button
          onClick={() => setMostrarImportar(v => !v)}
          className={`btn ${mostrarImportar ? 'btn-primary' : 'btn-outline'}`}
        >
          Importar CSV
        </button>
      </div>

      <div className="toolbar">
        <FiltrosPanelRAI
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          filtroZona={filtroZona}
          setFiltroZona={setFiltroZona}
          filtroDepartamento={filtroDepartamento}
          setFiltroDepartamento={setFiltroDepartamento}
          filtroMunicipio={filtroMunicipio}
          setFiltroMunicipio={setFiltroMunicipio}
          referenciales={referenciales}
        />
      </div>

      <EstadisticasPanelRAI referenciales={referencialesFiltrados} />

      {mostrarImportar && (
        <ImportarCSVRAI
          onImportado={cargarReferenciales}
          onCerrar={() => setMostrarImportar(false)}
        />
      )}

      <div className="vista-tabs">
        <button
          className={`tab ${vistaActiva === 'tabla' ? 'tab-activo' : ''}`}
          onClick={() => setVistaActiva('tabla')}
        >
          Tabla
        </button>
        <button
          className={`tab ${vistaActiva === 'mapa' ? 'tab-activo' : ''}`}
          onClick={() => setVistaActiva('mapa')}
        >
          Mapa
          {modoAsignarCoordenadas && (
            <span className="tab-badge">· click para ubicar</span>
          )}
        </button>
      </div>

      {error && <div className="alert alert-error">Error al cargar datos: {error}</div>}
      {loading && <div className="loading">Cargando referenciales RAI…</div>}

      {!loading && vistaActiva === 'tabla' && (
        <TablaReferencialesRAI
          referenciales={referencialesFiltrados}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
          onAsignarCoordenadas={handleAsignarCoordenadas}
          onActualizarCoordenadas={handleActualizarCoordenadas}
        />
      )}

      {vistaActiva === 'mapa' && (
        <MapaReferencialesRAI
          referenciales={referencialesFiltrados}
          modoAsignar={modoAsignarCoordenadas}
          referencialActivo={referencialParaCoordenadas}
          onMapaClick={handleMapaClick}
          onCancelarAsignar={handleCancelarAsignar}
          onActualizarCoordenadas={handleActualizarCoordenadas}
        />
      )}

      {mostrarFormulario && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) handleCerrarFormulario() }}
        >
          <div className="modal-content">
            <FormularioReferencialRAI
              referencial={referencialEditar}
              onGuardar={handleGuardar}
              onCancelar={handleCerrarFormulario}
            />
          </div>
        </div>
      )}
    </>
  )
}
