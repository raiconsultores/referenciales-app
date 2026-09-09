import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORES_TIPO = {
  Casa:        '#2563eb',
  Apartamento: '#16a34a',
  Terreno:     '#ea580c',
  Comercio:    '#9333ea',
  Oficina:     '#0891b2',
  Otro:        '#6b7280',
}

function TooltipContent({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const { tipo, cantidad } = payload[0].payload
  const pct = total ? ((cantidad / total) * 100).toFixed(1) : 0
  return (
    <div className="dashboard-tooltip">
      <strong>{tipo}</strong>
      <div>{cantidad} referenciales · {pct}%</div>
    </div>
  )
}

export default function DashboardDistribucionTipo({ data }) {
  const total = data.reduce((s, d) => s + d.cantidad, 0)

  if (!total) {
    return <div className="dashboard-empty">Sin datos suficientes para mostrar.</div>
  }

  return (
    <div className="dashboard-donut-row">
      <div className="dashboard-donut-chart">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="cantidad"
              nameKey="tipo"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={COLORES_TIPO[d.tipo] ?? COLORES_TIPO.Otro} />
              ))}
            </Pie>
            <Tooltip content={<TooltipContent total={total} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-legend">
        {data
          .slice()
          .sort((a, b) => b.cantidad - a.cantidad)
          .map(d => (
            <div key={d.tipo} className="dashboard-legend-item">
              <span className="dashboard-legend-dot" style={{ background: COLORES_TIPO[d.tipo] ?? COLORES_TIPO.Otro }} />
              <span className="dashboard-legend-label">{d.tipo}</span>
              <span className="dashboard-legend-value">
                {d.cantidad} ({((d.cantidad / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
