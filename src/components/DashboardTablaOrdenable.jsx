import { useMemo, useState } from 'react'

export default function DashboardTablaOrdenable({
  titulo,
  nota,
  filas,
  columnas,
  ordenInicial,
  conBuscador = false,
  buscarPlaceholder = 'Buscar…',
  buscarCampo,
  vacioTexto = 'No hay datos que mostrar.',
}) {
  const [orden, setOrden] = useState(ordenInicial)
  const [busqueda, setBusqueda] = useState('')

  const filasVisibles = useMemo(() => {
    let resultado = filas
    if (conBuscador && busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      resultado = resultado.filter(f => buscarCampo(f).toLowerCase().includes(q))
    }
    if (orden) {
      const col = columnas.find(c => c.key === orden.key)
      const getValor = col?.sortValue ?? (f => f[orden.key])
      resultado = [...resultado].sort((a, b) => {
        const va = getValor(a)
        const vb = getValor(b)
        if (va == null && vb == null) return 0
        if (va == null) return 1
        if (vb == null) return -1
        if (typeof va === 'string') return orden.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
        return orden.dir === 'asc' ? va - vb : vb - va
      })
    }
    return resultado
  }, [filas, orden, busqueda, columnas, conBuscador, buscarCampo])

  const handleOrdenar = (key) => {
    setOrden(prev =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' }
    )
  }

  return (
    <div className="tabla-container">
      <div className="dashboard-table-toolbar">
        <div>
          <h3>{titulo}</h3>
          {nota && <p className="dashboard-card-sub" style={{ marginBottom: 0, marginTop: 2 }}>{nota}</p>}
        </div>
        {conBuscador && (
          <div className="filtro-busqueda">
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder={buscarPlaceholder}
              className="filtro-input filtro-input-busqueda"
              style={{ width: 220 }}
            />
          </div>
        )}
      </div>

      {filasVisibles.length === 0 ? (
        <div className="dashboard-empty">{vacioTexto}</div>
      ) : (
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                {columnas.map(col => (
                  <th
                    key={col.key}
                    className={`th-sortable${col.align === 'right' ? ' num' : ''}`}
                    onClick={() => handleOrdenar(col.key)}
                  >
                    {col.label}
                    {orden?.key === col.key && (
                      <span className="sort-arrow">{orden.dir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasVisibles.map((fila, i) => (
                <tr key={i} className="tabla-fila">
                  {columnas.map(col => (
                    <td key={col.key} className={col.align === 'right' ? 'num' : undefined}>
                      {col.format ? col.format(fila) : fila[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
