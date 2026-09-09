import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import DashboardBarChart from './DashboardBarChart'
import DashboardDistribucionTipo from './DashboardDistribucionTipo'
import DashboardTablaOrdenable from './DashboardTablaOrdenable'

const MUNICIPIO_ZONAS = 'Ciudad de Guatemala'
const TIPOS_CANONICOS = ['Casa', 'Apartamento', 'Terreno', 'Comercio', 'Oficina']
const MUESTRA_MINIMA = 3
const MESES_VENTANA = 12

const fmtQ = (n) =>
  n != null ? `Q ${Math.round(n).toLocaleString('es-GT')}` : '—'

const fmtFecha = (d) =>
  d.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })

function calcularCorteVentana() {
  const corte = new Date()
  corte.setHours(0, 0, 0, 0)
  corte.setMonth(corte.getMonth() - MESES_VENTANA)
  return corte
}

function dentroDeVentana(fechaCaptura, corte) {
  if (!fechaCaptura) return false
  const fecha = new Date(fechaCaptura)
  if (Number.isNaN(fecha.getTime())) return false
  return fecha >= corte
}

const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 4.5H15" /><path d="M6 9H15" /><path d="M6 13.5H15" />
    <path d="M3 4.5H3.01" /><path d="M3 9H3.01" /><path d="M3 13.5H3.01" />
  </svg>
)
const IconLand = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 15L6.5 5.5L10 12L12.5 7.5L16 15" /><path d="M2 15H16" />
  </svg>
)
const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2.5" width="10" height="13" rx="1" />
    <path d="M7 6H8" /><path d="M10 6H11" /><path d="M7 9H8" /><path d="M10 9H11" />
    <path d="M7.5 15.5V12.5H10.5V15.5" />
  </svg>
)
const IconCalendario = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" />
    <path d="M2.5 7H15.5" />
    <path d="M5.5 2V4.5" /><path d="M12.5 2V4.5" />
  </svg>
)
const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3H12V8C12 9.66 10.66 11 9 11C7.34 11 6 9.66 6 8V3Z" />
    <path d="M6 4H3.5V5.5C3.5 6.88 4.62 8 6 8" />
    <path d="M12 4H14.5V5.5C14.5 6.88 13.38 8 12 8" />
    <path d="M9 11V14" /><path d="M6.5 15.5H11.5L11 14H7L6.5 15.5Z" />
  </svg>
)

const avg = (arr, campo) =>
  arr.length ? arr.reduce((s, r) => s + parseFloat(r[campo] ?? 0), 0) / arr.length : null

export function useDashboardData(referencialesOriginal) {
  return useMemo(() => {
    const corte = calcularCorteVentana()
    const referenciales = referencialesOriginal.filter(r => dentroDeVentana(r.fecha_captura, corte))

    const total = referenciales.length
    const conTerreno      = referenciales.filter(r => r.precio_m2_terreno != null)
    const conConstruccion = referenciales.filter(r => r.precio_m2_construccion != null)

    const avgTerrenoGeneral      = avg(conTerreno, 'precio_m2_terreno')
    const avgConstruccionGeneral = avg(conConstruccion, 'precio_m2_construccion')

    const porMunicipio = new Map()
    referenciales.forEach(r => {
      const mun = r.municipio?.trim()
      if (!mun) return
      if (!porMunicipio.has(mun)) porMunicipio.set(mun, [])
      porMunicipio.get(mun).push(r)
    })

    const municipios = [...porMunicipio.entries()]
      .map(([municipio, items]) => {
        const terrenoItems      = items.filter(r => r.precio_m2_terreno != null)
        const construccionItems = items.filter(r => r.precio_m2_construccion != null)
        const conPrecio = items.filter(r => r.precio_m2_terreno != null || r.precio_m2_construccion != null)
        const precios = items.map(r => r.precio_quetzales).filter(v => v != null).map(Number)
        return {
          municipio,
          muestra:         conPrecio.length,
          avgTerreno:      avg(terrenoItems, 'precio_m2_terreno'),
          avgConstruccion: avg(construccionItems, 'precio_m2_construccion'),
          precioMin: precios.length ? Math.min(...precios) : null,
          precioMax: precios.length ? Math.max(...precios) : null,
        }
      })
      .filter(m => m.muestra >= MUESTRA_MINIMA)

    const top10Terreno = municipios
      .filter(m => m.avgTerreno != null)
      .sort((a, b) => b.avgTerreno - a.avgTerreno)
      .slice(0, 10)

    const top10Construccion = municipios
      .filter(m => m.avgConstruccion != null)
      .sort((a, b) => b.avgConstruccion - a.avgConstruccion)
      .slice(0, 10)

    const municipioTop = top10Terreno[0] ?? null

    const distribMap = new Map()
    referenciales.forEach(r => {
      const match = TIPOS_CANONICOS.find(c => c.toLowerCase() === (r.tipo || '').toLowerCase())
      const tipo = match || 'Otro'
      distribMap.set(tipo, (distribMap.get(tipo) ?? 0) + 1)
    })
    const distribTipo = [...distribMap.entries()].map(([tipo, cantidad]) => ({ tipo, cantidad }))

    const zonasItems = referenciales.filter(r => r.municipio === MUNICIPIO_ZONAS && r.zona)
    const porZona = new Map()
    zonasItems.forEach(r => {
      const z = r.zona.trim()
      if (!porZona.has(z)) porZona.set(z, [])
      porZona.get(z).push(r)
    })
    const zonas = [...porZona.entries()]
      .map(([zona, items]) => {
        const terrenoItems      = items.filter(r => r.precio_m2_terreno != null)
        const construccionItems = items.filter(r => r.precio_m2_construccion != null)
        const conPrecio = items.filter(r => r.precio_m2_terreno != null || r.precio_m2_construccion != null)
        return {
          zona,
          muestra:         conPrecio.length,
          avgTerreno:      avg(terrenoItems, 'precio_m2_terreno'),
          avgConstruccion: avg(construccionItems, 'precio_m2_construccion'),
        }
      })
      .filter(z => z.muestra >= MUESTRA_MINIMA)

    return {
      total, avgTerrenoGeneral, avgConstruccionGeneral, municipioTop,
      municipios, top10Terreno, top10Construccion, distribTipo, zonas,
      corte,
    }
  }, [referencialesOriginal])
}

export default function SeccionDashboardRAI() {
  const [referenciales, setReferenciales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('referenciales_rai')
      .select('*')
    if (error) setError(error.message)
    else setReferenciales(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const {
    total, avgTerrenoGeneral, avgConstruccionGeneral, municipioTop,
    municipios, top10Terreno, top10Construccion, distribTipo, zonas,
    corte,
  } = useDashboardData(referenciales)

  if (loading) return <div className="loading">Cargando análisis de mercado…</div>
  if (error)   return <div className="alert alert-error">Error al cargar datos: {error}</div>

  const dataTerreno      = top10Terreno.map(m => ({ nombre: `${m.municipio} (${m.muestra})`, valor: m.avgTerreno }))
  const dataConstruccion = top10Construccion.map(m => ({ nombre: `${m.municipio} (${m.muestra})`, valor: m.avgConstruccion }))

  return (
    <div>
      <div className="dashboard-periodo">
        <IconCalendario />
        Basado en referenciales de los últimos 12 meses (desde el {fmtFecha(corte)} hasta hoy)
      </div>

      <div className="stats-panel">
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-icon"><IconList /></span></div>
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Referenciales RAI</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-icon stat-icon-success"><IconLand /></span></div>
          <div className="stat-value">{fmtQ(avgTerrenoGeneral)}</div>
          <div className="stat-label">Promedio Q/m² Terreno</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-icon stat-icon-gold"><IconBuilding /></span></div>
          <div className="stat-value">{fmtQ(avgConstruccionGeneral)}</div>
          <div className="stat-label">Promedio Q/m² Construcción</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top"><span className="stat-icon"><IconTrophy /></span></div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {municipioTop ? `${municipioTop.municipio} (${municipioTop.muestra})` : '—'}
          </div>
          <div className="stat-label">Municipio con precio más alto</div>
          {municipioTop && <div className="stat-sub">{fmtQ(municipioTop.avgTerreno)}/m² terreno</div>}
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 18 }}>
        <div className="dashboard-card">
          <div className="dashboard-card-title">Top 10 municipios — Q/m² terreno</div>
          <div className="dashboard-card-sub">
            Ordenado de mayor a menor precio promedio · entre paréntesis, referenciales que respaldan el dato (mínimo 3)
          </div>
          <DashboardBarChart data={dataTerreno} formatValue={fmtQ} />
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">Top 10 municipios — Q/m² construcción</div>
          <div className="dashboard-card-sub">
            Ordenado de mayor a menor precio promedio · entre paréntesis, referenciales que respaldan el dato (mínimo 3)
          </div>
          <DashboardBarChart data={dataConstruccion} formatValue={fmtQ} />
        </div>

        <div className="dashboard-card dashboard-full">
          <div className="dashboard-card-title">Distribución por tipo de inmueble</div>
          <div className="dashboard-card-sub">{total} referenciales en total</div>
          <DashboardDistribucionTipo data={distribTipo} />
        </div>

        <div className="dashboard-full">
          <DashboardTablaOrdenable
            titulo="Ranking completo por municipio"
            nota="Solo se incluyen municipios con 3 o más referenciales con precio registrado"
            filas={municipios}
            conBuscador
            buscarPlaceholder="Buscar municipio…"
            buscarCampo={f => f.municipio}
            ordenInicial={{ key: 'muestra', dir: 'desc' }}
            vacioTexto="No hay municipios que coincidan con la búsqueda."
            columnas={[
              { key: 'municipio', label: 'Municipio' },
              { key: 'muestra', label: 'Referenciales', align: 'right' },
              { key: 'avgTerreno', label: 'Prom. Q/m² Terreno', align: 'right', format: f => fmtQ(f.avgTerreno) },
              { key: 'avgConstruccion', label: 'Prom. Q/m² Construcción', align: 'right', format: f => fmtQ(f.avgConstruccion) },
              { key: 'precioMin', label: 'Precio Mín.', align: 'right', format: f => fmtQ(f.precioMin) },
              { key: 'precioMax', label: 'Precio Máx.', align: 'right', format: f => fmtQ(f.precioMax) },
            ]}
          />
        </div>

        <div className="dashboard-full">
          <DashboardTablaOrdenable
            titulo={`Comparador de zonas — ${MUNICIPIO_ZONAS}`}
            nota="Solo se incluyen zonas con 3 o más referenciales con precio registrado"
            filas={zonas}
            ordenInicial={{ key: 'avgTerreno', dir: 'desc' }}
            vacioTexto="No hay zonas con al menos 3 referenciales con precio en Ciudad de Guatemala."
            columnas={[
              { key: 'zona', label: 'Zona' },
              { key: 'muestra', label: 'Referenciales', align: 'right' },
              { key: 'avgTerreno', label: 'Q/m² Terreno Promedio', align: 'right', format: f => fmtQ(f.avgTerreno) },
              { key: 'avgConstruccion', label: 'Q/m² Construcción Promedio', align: 'right', format: f => fmtQ(f.avgConstruccion) },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
