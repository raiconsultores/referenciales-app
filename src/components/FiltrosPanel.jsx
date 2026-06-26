export default function FiltrosPanel({
  filtroZona, setFiltroZona,
  filtroTipo, setFiltroTipo,
  filtroDepartamento, setFiltroDepartamento,
  filtroMunicipio, setFiltroMunicipio,
  referenciales,
}) {
  const hasFiltro = filtroZona || filtroTipo || filtroDepartamento || filtroMunicipio

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
  }

  return (
    <div className="filtros-panel">

      <div className="filtros-fila">
        <input
          type="text"
          value={filtroZona}
          onChange={e => setFiltroZona(e.target.value)}
          placeholder="Buscar por zona o dirección…"
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
        {hasFiltro && (
          <button
            onClick={() => {
              setFiltroZona('')
              setFiltroTipo('')
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
            onClick={() => setFiltroMunicipio('')}
          >
            Todos
          </button>
          {municipios.map(mun => (
            <button
              key={mun}
              className={`btn-filtro${filtroMunicipio === mun ? ' btn-filtro-activo' : ''}`}
              onClick={() => setFiltroMunicipio(mun)}
            >
              {mun}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
