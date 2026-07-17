import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import SeccionExternos from './components/SeccionExternos'
import SeccionRAI from './components/SeccionRAI'
import LoginScreen from './components/LoginScreen'

export default function App() {
  const [session, setSession]           = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [seccionActiva, setSeccionActiva] = useState('externos')

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
          </nav>
        </div>
      </header>

      <main className="app-main">
        {seccionActiva === 'externos' ? <SeccionExternos /> : <SeccionRAI />}
      </main>
    </div>
  )
}
