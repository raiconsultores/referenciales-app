import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import TablaReferenciales from './components/TablaReferenciales'
import MapaReferenciales from './components/MapaReferenciales'
import FormularioReferencial from './components/FormularioReferencial'
import EstadisticasPanel from './components/EstadisticasPanel'
import FiltrosPanel from './components/FiltrosPanel'
import ImportarCSV from './components/ImportarCSV'
import LoginScreen from './components/LoginScreen'

export default function App() {
  const [session, setSession]           = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [referenciales, setReferenciales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filtroZona, setFiltroZona] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const [vistaActiva, setVistaActiva] = useState('tabla')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [referencialEditar, setReferencialEditar] = useState(null)
  const [mostrarImportar, setMostrarImportar] = useState(false)

  const [modoAsignarCoordenadas, setModoAsignarCoordenadas] = useState(false)
  const [referencialParaCoordenadas, setReferencialParaCoordenadas] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCheckingAuth(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const cargarReferenciales = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('referenciales')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setReferenciales(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarReferenciales() }, [cargarReferenciales])

  const referencialesFiltrados = referenciales.filter(r => {
    const texto = filtroZona.toLowerCase()
    const coincideTexto = !filtroZona ||
      r.zona?.toLowerCase().includes(texto) ||
      r.direccion?.toLowerCase().includes(texto)
    const coincideTipo = !filtroTipo || r.tipo === filtroTipo
    return coincideTexto && coincideTipo
  })

  const handleMapaClick = async (lat, lng) => {
    if (!modoAsignarCoordenadas || !referencialParaCoordenadas) return
    const { error } = await supabase
      .from('referenciales')
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

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este referencial? Esta acción no se puede deshacer.')) return
    const { error } = await supabase.from('referenciales').delete().eq('id', id)
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

  if (checkingAuth) {
    return <div className="auth-loading">Verificando sesión…</div>
  }

  if (!session) {
    return <LoginScreen />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1 className="header-title">Referenciales Inmobiliarios</h1>
            <p className="header-sub">Guatemala</p>
          </div>
          <div className="header-actions">
            <button onClick={handleNuevo} className="btn btn-primary">
              + Nuevo
            </button>
            <button
              onClick={() => setMostrarImportar(v => !v)}
              className={`btn btn-secondary ${mostrarImportar ? 'btn-active' : ''}`}
            >
              Importar CSV
            </button>
            <div className="header-divider" />
            <span className="header-email">{session.user.email}</span>
            <button onClick={handleLogout} className="btn btn-logout">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="toolbar">
          <FiltrosPanel
            filtroZona={filtroZona}
            setFiltroZona={setFiltroZona}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
          />
        </div>

        <EstadisticasPanel referenciales={referencialesFiltrados} />

        {mostrarImportar && (
          <ImportarCSV
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
        {loading && <div className="loading">Cargando referenciales…</div>}

        {!loading && vistaActiva === 'tabla' && (
          <TablaReferenciales
            referenciales={referencialesFiltrados}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            onAsignarCoordenadas={handleAsignarCoordenadas}
          />
        )}

        {vistaActiva === 'mapa' && (
          <MapaReferenciales
            referenciales={referencialesFiltrados}
            modoAsignar={modoAsignarCoordenadas}
            referencialActivo={referencialParaCoordenadas}
            onMapaClick={handleMapaClick}
            onCancelarAsignar={handleCancelarAsignar}
          />
        )}
      </main>

      {mostrarFormulario && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) handleCerrarFormulario() }}
        >
          <div className="modal-content">
            <FormularioReferencial
              referencial={referencialEditar}
              onGuardar={handleGuardar}
              onCancelar={handleCerrarFormulario}
            />
          </div>
        </div>
      )}
    </div>
  )
}
