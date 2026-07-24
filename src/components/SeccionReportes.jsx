import { useState } from 'react'

const ESTADOS = ['Pendiente', 'Revisado', 'Corregido']

const fmtFecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export default function SeccionReportes({ flags, loading, error, onActualizarEstado }) {
  const [filtroEstado, setFiltroEstado] = useState('')

  const flagsFiltrados = filtroEstado
    ? flags.filter(f => f.estado === filtroEstado)
    : flags

  if (loading) return <div className="loading">Cargando reportes…</div>

  return (
    <>
      <div className="toolbar">
        <div className="filtros-fila filtros-botones">
          <button
            className={`btn-filtro${!filtroEstado ? ' btn-filtro-activo' : ''}`}
            onClick={() => setFiltroEstado('')}
          >
            Todos
          </button>
          {ESTADOS.map(e => (
            <button
              key={e}
              className={`btn-filtro${filtroEstado === e ? ' btn-filtro-activo' : ''}`}
              onClick={() => setFiltroEstado(e)}
            >
              {e}s
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">Error al cargar reportes: {error}</div>}

      {flagsFiltrados.length === 0 ? (
        <div className="tabla-vacia">No hay reportes que coincidan con el filtro actual.</div>
      ) : (
        <div className="tabla-container">
          <div className="tabla-meta">
            <span>{flagsFiltrados.length} reporte{flagsFiltrados.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Dirección</th>
                  <th>Municipio</th>
                  <th>Zona</th>
                  <th>Motivo</th>
                  <th>Comentario</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {flagsFiltrados.map(f => (
                  <tr key={f.id} className="tabla-fila">
                    <td>{f.referenciales?.direccion || '—'}</td>
                    <td>{f.referenciales?.municipio || '—'}</td>
                    <td>{f.referenciales?.zona || '—'}</td>
                    <td>{f.motivo}</td>
                    <td className="observaciones-cell" title={f.comentario ?? ''}>
                      {f.comentario || '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtFecha(f.created_at)}</td>
                    <td>
                      <span className={`estado-badge estado-${f.estado.toLowerCase()}`}>{f.estado}</span>
                    </td>
                    <td className="acciones-cell">
                      {f.estado !== 'Revisado' && f.estado !== 'Corregido' && (
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => onActualizarEstado(f.id, 'Revisado')}
                        >
                          Marcar como revisado
                        </button>
                      )}
                      {f.estado !== 'Corregido' && (
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => onActualizarEstado(f.id, 'Corregido')}
                        >
                          Marcar como corregido
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
