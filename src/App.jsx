import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from './supabaseClient'
import SeccionExternos from './components/SeccionExternos'
import SeccionRAI from './components/SeccionRAI'
import SeccionReportes from './components/SeccionReportes'
import LoginScreen from './components/LoginScreen'

const IconLogo = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9.5L10 3L17 9.5" />
    <path d="M4.5 8.5V16.5H15.5V8.5" />
    <path d="M8 16.5V12H12V16.5" />
  </svg>
)

const IconExternos = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="11" y="3" width="6" height="6" rx="1" />
    <rect x="3" y="11" width="6" height="6" rx="1" />
    <rect x="11" y="11" width="6" height="6" rx="1" />
  </svg>
)

const IconRAI = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="10" cy="5" rx="6.5" ry="2.5" />
    <path d="M3.5 5V15C3.5 16.38 6.46 17.5 10 17.5C13.54 17.5 16.5 16.38 16.5 15V5" />
    <path d="M16.5 10C16.5 11.38 13.54 12.5 10 12.5C6.46 12.5 3.5 11.38 3.5 10" />
  </svg>
)

const IconReportes = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 2.5V17.5" />
    <path d="M4.5 3.5H14.5L12.5 6.5L14.5 9.5H4.5" />
  </svg>
)

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.5 12.5H3C2.45 12.5 2 12.05 2 11.5V2.5C2 1.95 2.45 1.5 3 1.5H5.5" />
    <path d="M9.5 9.5L12.5 6.5L9.5 3.5" />
    <path d="M12.5 6.5H5.5" />
  </svg>
)

export default function App() {
  const [session, setSession]           = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [seccionActiva, setSeccionActiva] = useState('externos')

  const [flags, setFlags]             = useState([])
  const [flagsLoading, setFlagsLoading] = useState(true)
  const [flagsError, setFlagsError]     = useState(null)

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

  const cargarFlags = useCallback(async () => {
    setFlagsLoading(true)
    setFlagsError(null)
    const { data, error } = await supabase
      .from('referenciales_flags')
      .select('*, referenciales(direccion, municipio, zona)')
      .order('created_at', { ascending: false })
    if (error) setFlagsError(error.message)
    else setFlags(data || [])
    setFlagsLoading(false)
  }, [])

  useEffect(() => { if (session) cargarFlags() }, [session, cargarFlags])

  const flagsPendientesIds = useMemo(
    () => new Set(flags.filter(f => f.estado === 'Pendiente').map(f => f.referencial_id)),
    [flags]
  )
  const pendientesCount = flagsPendientesIds.size

  const handleReportar = async (referencialId, motivo, comentario) => {
    const { error } = await supabase
      .from('referenciales_flags')
      .insert({ referencial_id: referencialId, motivo, comentario })
    if (error) throw error
    await cargarFlags()
  }

  const handleActualizarEstadoFlag = async (flagId, estado) => {
    const { error } = await supabase
      .from('referenciales_flags')
      .update({ estado })
      .eq('id', flagId)
    if (!error) cargarFlags()
    else alert('Error al actualizar el reporte: ' + error.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (checkingAuth) {
    return <div className="auth-loading">Verificando sesión…</div>
  }

  if (!session) {
    return <LoginScreen />
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon"><IconLogo /></span>
          <span className="sidebar-brand-text">
            Referenciales
            <small>Guatemala</small>
          </span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${seccionActiva === 'externos' ? 'sidebar-link-activo' : ''}`}
            onClick={() => setSeccionActiva('externos')}
          >
            <IconExternos />
            <span>Referenciales Externos</span>
          </button>
          <button
            className={`sidebar-link ${seccionActiva === 'rai' ? 'sidebar-link-activo' : ''}`}
            onClick={() => setSeccionActiva('rai')}
          >
            <IconRAI />
            <span>Referenciales RAI</span>
          </button>
          <button
            className={`sidebar-link ${seccionActiva === 'reportes' ? 'sidebar-link-activo' : ''}`}
            onClick={() => setSeccionActiva('reportes')}
          >
            <IconReportes />
            <span>Reportes</span>
            {pendientesCount > 0 && <span className="sidebar-badge">{pendientesCount}</span>}
          </button>
        </nav>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <div>
            <h1 className="topbar-title">Referenciales Inmobiliarios</h1>
            <p className="topbar-sub">Guatemala</p>
          </div>
          <div className="topbar-actions">
            {pendientesCount > 0 && (
              <button
                className="topbar-flags-badge"
                onClick={() => setSeccionActiva('reportes')}
                title="Ver reportes pendientes"
              >
                🚩 {pendientesCount} pendiente{pendientesCount !== 1 ? 's' : ''}
              </button>
            )}
            <span className="topbar-email">{session.user.email}</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              <IconLogout />
              Salir
            </button>
          </div>
        </header>

        <main className="app-main">
          {seccionActiva === 'externos' && (
            <SeccionExternos
              flagsPendientesIds={flagsPendientesIds}
              onReportar={handleReportar}
            />
          )}
          {seccionActiva === 'rai' && <SeccionRAI />}
          {seccionActiva === 'reportes' && (
            <SeccionReportes
              flags={flags}
              loading={flagsLoading}
              error={flagsError}
              onActualizarEstado={handleActualizarEstadoFlag}
            />
          )}
        </main>
      </div>
    </div>
  )
}
