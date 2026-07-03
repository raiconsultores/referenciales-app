export default function FiltrosPanel({
  filtroZona, setFiltroZona,
  filtroTipo, setFiltroTipo,
  filtroZonaNum, setFiltroZonaNum,
  filtroDepartamento, setFiltroDepartamento,
  filtroMunicipio, setFiltroMunicipio,
  referenciales,
}) {
  const hasFiltro = filtroZona || filtroTipo || filtroZonaNum || filtroDepartamento || filtroMunicipio

  // Zonas numéricas solo aplican para Ciudad de Guatemala
  // r.zona es ya la zona limpia: "Zona 10", "Km. 17.5", etc.
  const MUNICIPIO_ZONAS = 'Ciudad de Guatemala'
  const zonasNumericas = filtroMunicipio === MUNICIPIO_ZONAS
    ? [...new Set(
        referenciales
          .filter(r => r.municipio === MUNICIPIO_ZONAS)
          .map(r => { const m = (r.zona || '').match(/^Zona\s+(\d+)$/i); return m ? parseInt(m[1], 10) : null })
          .filter(n => n !== null)
      )].sort((a, b) => a - b)
    : []

  const departamentos = [...new Set(
    referenciales.map(r => r.departamento).filter(Boolean)
  )].sort()

  const municipios = filtroDepartamento
    ? [...new Set(
        referenciales
          .filter(r => r.departamento === filtroDepartamento && r.municipio)
          .map(r => r.municipio)
      )].sort()
    : []

  const handleDepartamento = (dep) => {
    setFiltroDepartamento(dep)
    setFiltroMunicipio('')
    setFiltroZonaNum('')
  }

  const handleMunicipio = (mun) => {
    setFiltroMunicipio(mun)
    setFiltroZonaNum('')
  }

  return (
    <div className="filtros-panel">

      <div className="filtros-fila">
        <input
          type="text"
          value={filtroZona}
          onChange={e => setFiltroZona(e.target.value)}
          placeholder="Buscar descripción o dirección…"
          className="filtro-input"
        />
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todos los tipos</option>
          <option value="Casa">Casa</option>
          <option value="Apartamento">Apartamento</option>
          <option value="Terreno">Terreno</option>
        </select>
        {filtroMunicipio === MUNICIPIO_ZONAS && zonasNumericas.length > 0 && (
          <select
            value={filtroZonaNum}
            onChange={e => setFiltroZonaNum(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todas las zonas</option>
            {zonasNumericas.map(n => (
              <option key={n} value={String(n)}>Zona {n}</option>
            ))}
          </select>
        )}
        {hasFiltro && (
          <button
            onClick={() => {
              setFiltroZona('')
              setFiltroTipo('')
              setFiltroZonaNum('')
              setFiltroDepartamento('')
              setFiltroMunicipio('')
            }}
            className="btn-clear"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {departamentos.length > 0 && (
        <div className="filtros-fila filtros-botones">
          <button
            className={`btn-filtro${!filtroDepartamento ? ' btn-filtro-activo' : ''}`}
            onClick={() => handleDepartamento('')}
          >
            Todos
          </button>
          {departamentos.map(dep => (
            <button
              key={dep}
              className={`btn-filtro${filtroDepartamento === dep ? ' btn-filtro-activo' : ''}`}
              onClick={() => handleDepartamento(dep)}
            >
              {dep}
            </button>
          ))}
        </div>
      )}

      {municipios.length > 0 && (
        <div className="filtros-fila filtros-botones">
          <button
            className={`btn-filtro${!filtroMunicipio ? ' btn-filtro-activo' : ''}`}
            onClick={() => handleMunicipio('')}
          >
            Todos
          </button>
          {municipios.map(mun => (
            <button
              key={mun}
              className={`btn-filtro${filtroMunicipio === mun ? ' btn-filtro-activo' : ''}`}
              onClick={() => handleMunicipio(mun)}
            >
              {mun}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
