export default function GeocodeResultsPicker({ resultados, onSeleccionar, onCancelar }) {
  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onCancelar() }}
    >
      <div className="modal-content modal-sm formulario">
        <h2>Varias coincidencias encontradas</h2>
        <p className="geocode-picker-hint">
          Nominatim no distingue el número exacto de la dirección — elige la ubicación correcta:
        </p>
        <ul className="geocode-picker-list">
          {resultados.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="geocode-picker-item"
                onClick={() => onSeleccionar(r)}
              >
                <span className="geocode-picker-name">{r.displayName}</span>
                <span className="geocode-picker-coords">{r.lat.toFixed(6)}, {r.lng.toFixed(6)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="form-actions">
          <button type="button" onClick={onCancelar} className="btn btn-ghost">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
