const fmtQ = (n) =>
  n != null ? `Q ${Math.round(n).toLocaleString('es-GT')}` : '—'

export default function EstadisticasPanelRAI({ referenciales }) {
  const total = referenciales.length

  const conTerreno      = referenciales.filter(r => r.precio_m2_terreno != null)
  const conConstruccion = referenciales.filter(r => r.precio_m2_construccion != null)

  const avg = (arr, campo) =>
    arr.length
      ? arr.reduce((s, r) => s + parseFloat(r[campo] ?? 0), 0) / arr.length
      : null

  const avgTerr   = avg(conTerreno,      'precio_m2_terreno')
  const avgConstr = avg(conConstruccion, 'precio_m2_construccion')

  return (
    <div className="stats-panel">
      <div className="stat-card">
        <div className="stat-value">{total}</div>
        <div className="stat-label">Total Registros</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{fmtQ(avgTerr)}</div>
        <div className="stat-label">Promedio Q/m² Terreno</div>
        <div className="stat-sub">{conTerreno.length} registros con m²</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{fmtQ(avgConstr)}</div>
        <div className="stat-label">Promedio Q/m² Construcción</div>
        <div className="stat-sub">{conConstruccion.length} registros con m²</div>
      </div>
    </div>
  )
}
