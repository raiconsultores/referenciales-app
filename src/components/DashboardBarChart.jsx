import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

const GOLD  = [200, 169, 110] // #C8A96E
const NAVY  = [30, 58, 95]    // #1E3A5F

function lerpColor(t) {
  const r = Math.round(GOLD[0] + (NAVY[0] - GOLD[0]) * t)
  const g = Math.round(GOLD[1] + (NAVY[1] - GOLD[1]) * t)
  const b = Math.round(GOLD[2] + (NAVY[2] - GOLD[2]) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function TooltipContent({ active, payload, formatValue }) {
  if (!active || !payload?.length) return null
  const { nombre, valor } = payload[0].payload
  return (
    <div className="dashboard-tooltip">
      <strong>{nombre}</strong>
      <div>{formatValue(valor)}</div>
    </div>
  )
}

export default function DashboardBarChart({ data, formatValue }) {
  if (!data.length) {
    return <div className="dashboard-empty">Sin datos suficientes para mostrar.</div>
  }

  const alturaFila = 32
  const altura = Math.max(160, data.length * alturaFila)

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'Inter, system-ui, sans-serif' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          width={155}
          tick={{ fontSize: 11.5, fill: '#1A1A2E', fontFamily: 'Inter, system-ui, sans-serif' }}
          axisLine={{ stroke: '#E5E7EB' }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(30,58,95,.05)' }}
          content={<TooltipContent formatValue={formatValue} />}
        />
        <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((_, i) => (
            <Cell key={i} fill={lerpColor(data.length > 1 ? i / (data.length - 1) : 0)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
