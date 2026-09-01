import { useRef } from 'react'

const TIPOS = ['Casa', 'Apartamento', 'Terreno', 'Comercio', 'Oficina']

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="6" cy="6" r="4.5" />
    <path d="M12.5 12.5L9.5 9.5" />
  </svg>
)

export default function FiltrosPanelRAI({
  filtroTexto, setFiltroTexto,
  filtroTipo, setFiltroTipo,
  filtroZona, setFiltroZona,
  filtroDepartamento, setFiltroDepartamento,
  filtroMunicipio, setFiltroMunicipio,
  referenciales,
}) {
  const inputBusquedaRef = useRef(null)
  const hasFiltro = filtroTexto || filtroTipo || filtroZona || filtroDepartamento || filtroMunicipio

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
        <div className="filtro-busqueda">
          <input
            ref={inputBusquedaRef}
            type="text"
            value={filtroTexto}
            onChange={e => setFiltroTexto(e.target.value)}
            placeholder="Buscar por dirección, colonia, no. avalúo…"
            className="filtro-input filtro-input-busqueda"
          />
          <button
            type="button"
            className="btn-buscar"
            title="Buscar"
            tabIndex={-1}
            onClick={() => inputBusquedaRef.current?.focus()}
          >
            <IconSearch />
          </button>
        </div>

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
              setFiltroTexto('')
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
