import { useState, useEffect, useRef } from 'react'

const MOTIVOS = [
  'Coordenadas incorrectas',
  'Precio erróneo',
  'Datos incompletos',
  'Duplicado',
  'Otro',
]

export default function ReportarModal({ referencial: r, onCerrar, onEnviar }) {
  const [motivo, setMotivo]         = useState(MOTIVOS[0])
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando]     = useState(false)
  const [enviado, setEnviado]       = useState(false)
  const [error, setError]           = useState(null)
  const cerrarTimeout = useRef(null)

  useEffect(() => {
    setMotivo(MOTIVOS[0])
    setComentario('')
    setEnviando(false)
    setEnviado(false)
    setError(null)
  }, [r?.id])

  useEffect(() => () => clearTimeout(cerrarTimeout.current), [])

  if (!r) return null

  const handleEnviar = async () => {
    setEnviando(true)
    setError(null)
    try {
      await onEnviar(r.id, motivo, comentario.trim() || null)
      setEnviado(true)
      cerrarTimeout.current = setTimeout(onCerrar, 1400)
    } catch (err) {
      setError(err?.message ?? 'Error al enviar el reporte')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="modal-content modal-sm">
        <div className="formulario">
          <h2>Reportar referencial</h2>
          <p className="reportar-target">{r.direccion || r.zona || 'Referencial'}</p>

          {enviado ? (
            <div className="importar-ok">✓ Reporte enviado</div>
          ) : (
            <>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label>Motivo *</label>
                  <select value={motivo} onChange={e => setMotivo(e.target.value)}>
                    {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group form-full">
                  <label>Comentario adicional</label>
                  <textarea
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    rows={3}
                    placeholder="Detalle opcional…"
                  />
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="form-actions">
                <button type="button" onClick={onCerrar} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="button" onClick={handleEnviar} disabled={enviando} className="btn btn-primary">
                  {enviando ? 'Enviando…' : 'Enviar reporte'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
