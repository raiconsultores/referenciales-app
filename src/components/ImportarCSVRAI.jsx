import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../supabaseClient'

const TIPOS_VALIDOS = ['Casa', 'Apartamento', 'Terreno', 'Comercio', 'Oficina']
const MONEDAS_VALIDAS = ['GTQ', 'USD']

export default function ImportarCSVRAI({ onImportado, onCerrar }) {
  const [filas, setFilas]         = useState([])
  const [validas, setValidas]     = useState([])
  const [parseError, setParseError] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [dbError, setDbError]     = useState(null)
  const fileRef = useRef()

  const n = (v) => (v !== undefined && v !== '' ? parseFloat(v) : null)
  const i = (v) => (v !== undefined && v !== '' ? parseInt(v, 10) : null)

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
          f.tipo && TIPOS_VALIDOS.includes(f.tipo?.trim()) &&
          f.direccion_original &&
          f.precio_original && !isNaN(parseFloat(f.precio_original)) &&
          f.moneda && MONEDAS_VALIDAS.includes(f.moneda?.trim())
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

    const registros = validas.map(f => {
      const moneda = f.moneda.trim()
      const precioOriginal = parseFloat(f.precio_original)
      const tipoCambio = moneda === 'USD' ? n(f.tipo_cambio) : null
      const precioQuetzales = moneda === 'GTQ'
        ? precioOriginal
        : (tipoCambio != null ? precioOriginal * tipoCambio : null)

      return {
        no_avaluo:            f.no_avaluo?.trim() || null,
        fecha_captura:        f.fecha_captura?.trim() || null,
        tipo:                 f.tipo.trim(),
        direccion_original:   f.direccion_original.trim(),
        calle_avenida_numero: f.calle_avenida_numero?.trim() || null,
        calle_avenida:        f.calle_avenida?.trim() || null,
        numero:               f.numero?.trim() || null,
        zona:                 f.zona?.trim() || null,
        colonia:              f.colonia?.trim() || null,
        municipio:            f.municipio?.trim() || null,
        departamento:         f.departamento?.trim() || null,
        lat:                  n(f.lat),
        lng:                  n(f.lng),
        m2_terreno:           n(f.m2_terreno),
        m2_construccion:      n(f.m2_construccion),
        habitaciones:         i(f.habitaciones),
        banos:                i(f.banos),
        parqueos:             i(f.parqueos),
        antiguedad:           i(f.antiguedad),
        estado_conservacion:  f.estado_conservacion?.trim() || null,
        moneda,
        precio_original:      precioOriginal,
        tipo_cambio:          tipoCambio,
        precio_quetzales:     precioQuetzales,
        fuente:               f.fuente?.trim() || null,
        contacto:             f.contacto?.trim() || null,
        url:                  f.url?.trim() || null,
        observaciones:        f.observaciones?.trim() || null,
      }
    })

    const BATCH = 50
    let importados = 0

    for (let idx = 0; idx < registros.length; idx += BATCH) {
      const { error } = await supabase
        .from('referenciales_rai')
        .insert(registros.slice(idx, idx + BATCH))
      if (error) {
        setDbError(error.message)
        setImportando(false)
        return
      }
      importados += Math.min(BATCH, registros.length - idx)
    }

    setResultado({ importados, omitidas: filas.length - validas.length })
    setImportando(false)
    onImportado()
  }

  const omitidas = filas.length - validas.length

  return (
    <div className="importar-panel">
      <div className="importar-header">
        <h3>Importar Referenciales RAI desde CSV</h3>
        <button onClick={onCerrar} className="btn-close" aria-label="Cerrar">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M1 1L11 11M11 1L1 11"/>
          </svg>
        </button>
      </div>

      <p className="importar-hint">
        El archivo debe tener estas columnas (con encabezado):<br />
        <code>no_avaluo, fecha_captura, tipo, direccion_original, calle_avenida_numero, calle_avenida, numero, zona, colonia, municipio, departamento, lat, lng, m2_terreno, m2_construccion, habitaciones, banos, parqueos, antiguedad, estado_conservacion, moneda, precio_original, tipo_cambio, fuente, contacto, url, observaciones</code><br />
        Columnas requeridas: <strong>tipo</strong> (Casa/Apartamento/Terreno/Comercio/Oficina), <strong>direccion_original</strong>, <strong>precio_original</strong>, <strong>moneda</strong> (GTQ/USD).
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
                    <th>Dirección Original</th>
                    <th>Colonia</th>
                    <th>Moneda</th>
                    <th>Precio Original</th>
                  </tr>
                </thead>
                <tbody>
                  {validas.slice(0, 6).map((f, idx) => (
                    <tr key={idx}>
                      <td>{f.tipo}</td>
                      <td>{f.direccion_original}</td>
                      <td>{f.colonia}</td>
                      <td>{f.moneda}</td>
                      <td>{f.precio_original}</td>
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
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block',verticalAlign:'middle',marginRight:6}} aria-hidden="true"><path d="M2 7L5.5 10.5L12 3.5"/></svg>
          {resultado.importados} referencial{resultado.importados !== 1 ? 'es' : ''} importados correctamente.
          {resultado.omitidas > 0 && ` (${resultado.omitidas} filas omitidas por datos inválidos)`}
        </div>
      )}
    </div>
  )
}
