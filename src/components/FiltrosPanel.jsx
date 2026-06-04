export default function FiltrosPanel({ filtroZona, setFiltroZona, filtroTipo, setFiltroTipo }) {
  const hasFiltro = filtroZona || filtroTipo

  return (
    <div className="filtros-panel">
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
          onClick={() => { setFiltroZona(''); setFiltroTipo('') }}
          className="btn-clear"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
