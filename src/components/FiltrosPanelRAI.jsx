const TIPOS = ['Casa', 'Apartamento', 'Terreno', 'Comercio', 'Oficina']

export default function FiltrosPanelRAI({
  filtroTipo, setFiltroTipo,
  filtroZona, setFiltroZona,
  filtroDepartamento, setFiltroDepartamento,
  filtroMunicipio, setFiltroMunicipio,
  referenciales,
}) {
  const hasFiltro = filtroTipo || filtroZona || filtroDepartamento || filtroMunicipio

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

  const zonas = [...new Set(
    referenciales
      .filter(r => (!filtroDepartamento || r.departamento === filtroDepartamento)
                && (!filtroMunicipio || r.municipio === filtroMunicipio)
                && r.zona)
      .map(r => r.zona)
  )].sort()

  const handleDepartamento = (dep) => {
    setFiltroDepartamento(dep)
    setFiltroMunicipio('')
    setFiltroZona('')
  }

  const handleMunicipio = (mun) => {
    setFiltroMunicipio(mun)
    setFiltroZona('')
  }

  return (
    <div className="filtros-panel">

      <div className="filtros-fila">
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="filtro-select"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {zonas.length > 0 && (
          <select
            value={filtroZona}
            onChange={e => setFiltroZona(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todas las zonas</option>
            {zonas.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        )}

        {hasFiltro && (
          <button
            onClick={() => {
              setFiltroTipo('')
              setFiltroZona('')
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
