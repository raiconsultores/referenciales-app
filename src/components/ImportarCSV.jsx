import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../supabaseClient'

const COLUMNAS_REQUERIDAS = ['tipo', 'zona', 'direccion', 'precio_total', 'fecha']

export default function ImportarCSV({ onImportado, onCerrar }) {
  const [filas, setFilas]         = useState([])
  const [validas, setValidas]     = useState([])
  const [parseError, setParseError] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [dbError, setDbError]     = useState(null)
  const fileRef = useRef()

  const n = (v) => (v !== undefined && v !== '' ? parseFloat(v) : null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResultado(null)
    setDbError(null)
    setParseError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: ({ data, errors }) => {
        if (errors.length) {
          setParseError(errors[0].message)
          return
        }
        setFilas(data)
        const ok = data.filter(f =>
          f.tipo && f.zona && f.direccion && f.precio_total && f.fecha &&
          !isNaN(parseFloat(f.precio_total)) &&
          ['Casa', 'Apartamento', 'Terreno'].includes(f.tipo?.trim())
        )
        setValidas(ok)
      },
      error: (err) => setParseError(err.message),
    })
  }

  const handleImportar = async () => {
    if (validas.length === 0) return
    setImportando(true)
    setDbError(null)

    const registros = validas.map(f => ({
      tipo:            f.tipo.trim(),
      zona:            f.zona.trim(),
      direccion:       f.direccion.trim(),
      precio_total:    parseFloat(f.precio_total),
      m2_terreno:      n(f.m2_terreno),
      m2_construccion: n(f.m2_construccion),
      fecha:           f.fecha.trim(),
      lat:             n(f.lat),
      lng:             n(f.lng),
      observaciones:   f.observaciones?.trim() || null,
    }))

    const BATCH = 50
    let importados = 0

    for (let i = 0; i < registros.length; i += BATCH) {
      const { error } = await supabase
        .from('referenciales')
        .insert(registros.slice(i, i + BATCH))
      if (error) {
        setDbError(error.message)
        setImportando(false)
        return
      }
      importados += Math.min(BATCH, registros.length - i)
    }

    setResultado({ importados, omitidas: filas.length - validas.length })
    setImportando(false)
    onImportado()
  }

  const omitidas = filas.length - validas.length

  return (
    <div className="importar-panel">
      <div className="importar-header">
        <h3>Importar desde CSV</h3>
        <button onClick={onCerrar} className="btn-close" aria-label="Cerrar">✕</button>
      </div>

      <p className="importar-hint">
        El archivo debe tener estas columnas (con encabezado):<br />
        <code>tipo, zona, direccion, precio_total, m2_terreno, m2_construccion, fecha, lat, lng, observaciones</code><br />
        Columnas requeridas: <strong>tipo</strong> (Casa/Apartamento/Terreno), <strong>zona</strong>, <strong>direccion</strong>, <strong>precio_total</strong>, <strong>fecha</strong>.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="file-input"
      />

      {parseError && <div className="form-error">Error al leer el archivo: {parseError}</div>}

      {filas.length > 0 && !resultado && (
        <>
          <p className="importar-count">
            {filas.length} fila{filas.length !== 1 ? 's' : ''} detectadas —{' '}
            <strong style={{ color: 'var(--success)' }}>{validas.length} válidas</strong>
            {omitidas > 0 && (
              <span style={{ color: 'var(--danger)' }}> · {omitidas} omitidas (datos inválidos)</span>
            )}
          </p>

          {validas.length > 0 && (
            <div className="preview-tabla-scroll">
              <table className="preview-tabla">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Zona</th>
                    <th>Dirección</th>
                    <th>Precio Total</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {validas.slice(0, 6).map((f, i) => (
                    <tr key={i}>
                      <td>{f.tipo}</td>
                      <td>{f.zona}</td>
                      <td>{f.direccion}</td>
                      <td>{f.precio_total}</td>
                      <td>{f.fecha}</td>
                    </tr>
                  ))}
                  {validas.length > 6 && (
                    <tr>
                      <td colSpan={5} className="preview-more">
                        … y {validas.length - 6} registros más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <button
            onClick={handleImportar}
            disabled={importando || validas.length === 0}
            className="btn btn-primary"
          >
            {importando ? 'Importando…' : `Importar ${validas.length} registros`}
          </button>
        </>
      )}

      {dbError && <div className="form-error">{dbError}</div>}

      {resultado && (
        <div className="importar-ok">
          ✓ {resultado.importados} referencial{resultado.importados !== 1 ? 'es' : ''} importados correctamente.
          {resultado.omitidas > 0 && ` (${resultado.omitidas} filas omitidas por datos inválidos)`}
        </div>
      )}
    </div>
  )
}
