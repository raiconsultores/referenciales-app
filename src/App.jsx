import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from './supabaseClient'
import SeccionExternos from './components/SeccionExternos'
import SeccionRAI from './components/SeccionRAI'
import SeccionReportes from './components/SeccionReportes'
import LoginScreen from './components/LoginScreen'

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
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1 className="header-title">Referenciales Inmobiliarios</h1>
            <p className="header-sub">Guatemala</p>
          </div>
          <div className="header-actions">
            {pendientesCount > 0 && (
              <button
                className="header-flags-badge"
                onClick={() => setSeccionActiva('reportes')}
                title="Ver reportes pendientes"
              >
                🚩 {pendientesCount} pendiente{pendientesCount !== 1 ? 's' : ''}
              </button>
            )}
            <span className="header-email">{session.user.email}</span>
            <button onClick={handleLogout} className="btn btn-logout">
              Salir
            </button>
          </div>
        </div>
        <div className="header-inner header-inner-nav">
          <nav className="seccion-tabs">
            <button
              className={`seccion-tab ${seccionActiva === 'externos' ? 'seccion-tab-activo' : ''}`}
              onClick={() => setSeccionActiva('externos')}
            >
              Referenciales Externos
            </button>
            <button
              className={`seccion-tab ${seccionActiva === 'rai' ? 'seccion-tab-activo' : ''}`}
              onClick={() => setSeccionActiva('rai')}
            >
              Referenciales RAI
            </button>
            <button
              className={`seccion-tab ${seccionActiva === 'reportes' ? 'seccion-tab-activo' : ''}`}
              onClick={() => setSeccionActiva('reportes')}
            >
              Reportes
              {pendientesCount > 0 && <span className="seccion-tab-badge">{pendientesCount}</span>}
            </button>
          </nav>
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
  )
}
