const fmtQ = (n) =>
  n != null
    ? `Q ${parseFloat(n).toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '—'

const fmtM2 = (n) =>
  n != null ? `${parseFloat(n).toLocaleString('es-GT')} m²` : '—'

const googleMapsUrl = (r) =>
  r.lat && r.lng
    ? `https://maps.google.com/?q=${r.lat},${r.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(`${r.direccion}, Guatemala`)}`

export default function TablaReferenciales({ referenciales, onEditar, onEliminar, onAsignarCoordenadas }) {
  if (referenciales.length === 0) {
    return (
      <div className="tabla-vacia">
        No hay referenciales que coincidan con los filtros actuales.
      </div>
    )
  }

  return (
    <div className="tabla-container">
      <div className="tabla-meta">
        <span>{referenciales.length} referencial{referenciales.length !== 1 ? 'es' : ''}</span>
      </div>

      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Zona</th>
              <th>Dirección</th>
              <th className="num">Precio Total</th>
              <th className="num">m² Terreno</th>
              <th className="num">m² Constr.</th>
              <th className="num">Q/m² Terreno</th>
              <th className="num">Q/m² Constr.</th>
              <th>Fecha</th>
              <th>Obs.</th>
              <th>Coords</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {referenciales.map(r => (
              <tr key={r.id}>
                <td>
                  <span className={`tipo-badge tipo-${r.tipo?.toLowerCase()}`}>
                    {r.tipo}
                  </span>
                </td>
                <td>{r.zona}</td>
                <td>{r.direccion}</td>
                <td className="num">{fmtQ(r.precio_total)}</td>
                <td className="num">{fmtM2(r.m2_terreno)}</td>
                <td className="num">{fmtM2(r.m2_construccion)}</td>
                <td className="num">{fmtQ(r.precio_m2_terreno)}</td>
                <td className="num">{fmtQ(r.precio_m2_construccion)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{r.fecha}</td>
                <td className="observaciones-cell" title={r.observaciones ?? ''}>
                  {r.observaciones || '—'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r.lat && r.lng
                    ? <span className="coords-ok" title={`${r.lat}, ${r.lng}`}>📍</span>
                    : <span className="coords-none">—</span>}
                </td>
                <td className="acciones-cell">
                  <button
                    className="btn-icon"
                    onClick={() => onEditar(r)}
                    title="Editar"
                  >✏️</button>
                  <button
                    className="btn-icon"
                    onClick={() => onAsignarCoordenadas(r)}
                    title="Asignar ubicación en mapa"
                  >🗺️</button>
                  <a
                    className="btn-icon"
                    href={googleMapsUrl(r)}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir en Google Maps"
                  >🌐</a>
                  <button
                    className="btn-icon icon-danger"
                    onClick={() => onEliminar(r.id)}
                    title="Eliminar"
                  >🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
