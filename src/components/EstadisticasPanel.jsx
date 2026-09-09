const fmtQ = (n) =>
  n != null ? `Q ${Math.round(n).toLocaleString('es-GT')}` : '—'

const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 4.5H15" /><path d="M6 9H15" /><path d="M6 13.5H15" />
    <path d="M3 4.5H3.01" /><path d="M3 9H3.01" /><path d="M3 13.5H3.01" />
  </svg>
)

const IconCoin = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="9" r="6.5" />
    <path d="M9 5.5V12.5" />
    <path d="M11 7C11 6 10.1 5.5 9 5.5C7.9 5.5 7 6 7 7C7 9 11 8 11 10.5C11 11.5 10.1 12 9 12C7.9 12 7 11.5 7 10.5" />
  </svg>
)

const IconLand = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 15L6.5 5.5L10 12L12.5 7.5L16 15" />
    <path d="M2 15H16" />
  </svg>
)

const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2.5" width="10" height="13" rx="1" />
    <path d="M7 6H8" /><path d="M10 6H11" /><path d="M7 9H8" /><path d="M10 9H11" />
    <path d="M7.5 15.5V12.5H10.5V15.5" />
  </svg>
)

const IconTrend = () => (
  <svg width="30" height="16" viewBox="0 0 30 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12L8 7L13 10L21 3L29 8" />
  </svg>
)

function StatCard({ icon, iconClass, value, label, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className={`stat-icon ${iconClass || ''}`}>{icon}</span>
        <span className="stat-trend"><IconTrend /></span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export default function EstadisticasPanel({ referenciales }) {
  const total = referenciales.length

  const conTerreno      = referenciales.filter(r => r.precio_m2_terreno != null)
  const conConstruccion = referenciales.filter(r => r.precio_m2_construccion != null)

  const avg = (arr, campo) =>
    arr.length
      ? arr.reduce((s, r) => s + parseFloat(r[campo] ?? 0), 0) / arr.length
      : null

  const avgPrecio     = avg(referenciales, 'precio_total')
  const avgTerr       = avg(conTerreno,    'precio_m2_terreno')
  const avgConstr     = avg(conConstruccion, 'precio_m2_construccion')

  return (
    <div className="stats-panel">
      <StatCard icon={<IconList />} value={total} label="Referenciales" />
      <StatCard icon={<IconCoin />} iconClass="stat-icon-gold" value={fmtQ(avgPrecio)} label="Precio Promedio" />
      <StatCard
        icon={<IconLand />} iconClass="stat-icon-success"
        value={fmtQ(avgTerr)} label="Promedio Q/m² Terreno"
        sub={`${conTerreno.length} registros con m²`}
      />
      <StatCard
        icon={<IconBuilding />}
        value={fmtQ(avgConstr)} label="Promedio Q/m² Construcción"
        sub={`${conConstruccion.length} registros con m²`}
      />
    </div>
  )
}
