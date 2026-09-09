import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { comprimirImagen, fmtBytes } from '../utils/imageCompression'

const BUCKET = 'referenciales-rai-fotos'
const MAX_BYTES = 10 * 1024 * 1024
const SIGNED_URL_TTL = 60 * 60 // 1 hora
const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']
const EXTENSIONES_ACEPTADAS = ['.jpg', '.jpeg', '.png', '.heic', '.heif']

function esArchivoValido(file) {
  const nombre = file.name.toLowerCase()
  const extensionValida = EXTENSIONES_ACEPTADAS.some(ext => nombre.endsWith(ext))
  const tipoValido = !file.type || TIPOS_ACEPTADOS.includes(file.type)
  return extensionValida && tipoValido
}

async function firmarUrls(paths) {
  const resultados = await Promise.all(
    paths.map(path => supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL))
  )
  const mapa = {}
  resultados.forEach((res, i) => {
    if (!res.error && res.data?.signedUrl) mapa[paths[i]] = res.data.signedUrl
  })
  return mapa
}

const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M1 1L11 11M11 1L1 11" />
  </svg>
)

const IconImagen = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="20" height="18" rx="2.5" />
    <circle cx="9" cy="10.5" r="2" />
    <path d="M3 18L9.5 12.5L14 16.5L18 13L23 17.5" />
  </svg>
)

const IconChevron = ({ flip }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M12 4L6 10L12 16" />
  </svg>
)

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 4H12" />
    <path d="M5 4V2.5H9V4" />
    <path d="M3 4L3.75 11.5H10.25L11 4" />
    <path d="M5.5 6.5V9.5" />
    <path d="M8.5 6.5V9.5" />
  </svg>
)

export default function FotosReferencialRAI({ referencialId, editable = true }) {
  const [fotos, setFotos]       = useState([])
  const [urls, setUrls]         = useState({})
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(null)
  const [error, setError]       = useState(null)
  const [resultadosCompresion, setResultadosCompresion] = useState([])
  const [arrastrando, setArrastrando] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const inputRef = useRef(null)
  const dragCounter = useRef(0)

  const cargarFotos = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('referenciales_rai_fotos')
      .select('*')
      .eq('referencial_id', referencialId)
      .order('orden', { ascending: true })
    const lista = error ? [] : (data || [])
    setFotos(lista)
    setUrls(await firmarUrls(lista.map(f => f.path)))
    setCargando(false)
  }, [referencialId])

  useEffect(() => {
    cargarFotos()
    setResultadosCompresion([])
    setError(null)
    setLightboxIndex(null)
  }, [cargarFotos])

  useEffect(() => {
    if (lightboxIndex == null) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      else if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + fotos.length) % fotos.length)
      else if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % fotos.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, fotos.length])

  const procesarArchivos = async (fileList) => {
    const archivos = Array.from(fileList || [])
    if (archivos.length === 0) return

    setError(null)
    setResultadosCompresion([])
    let siguienteOrden = fotos.reduce((max, f) => Math.max(max, f.orden ?? 0), 0) + 1
    let hayNuevas = false

    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i]

      if (!esArchivoValido(file)) {
        setError(`"${file.name}" no es un formato válido (solo JPG, PNG o HEIC).`)
        continue
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" supera el tamaño máximo de 10MB.`)
        continue
      }

      setSubiendo({ actual: i + 1, total: archivos.length, etapa: 'comprimiendo' })
      const { file: archivoFinal, originalSize, compressedSize, comprimido } = await comprimirImagen(file)
      setResultadosCompresion(prev => [...prev, { nombre: file.name, originalSize, compressedSize, comprimido }])

      setSubiendo({ actual: i + 1, total: archivos.length, etapa: 'subiendo' })

      try {
        const ext = file.name.slice(file.name.lastIndexOf('.')) || ''
        const path = `${referencialId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`

        const { error: errorSubida } = await supabase.storage
          .from(BUCKET)
          .upload(path, archivoFinal, { cacheControl: '3600', upsert: false })
        if (errorSubida) throw errorSubida

        const { error: errorInsert } = await supabase
          .from('referenciales_rai_fotos')
          .insert({
            referencial_id: referencialId,
            path,
            nombre: file.name,
            orden: siguienteOrden,
          })
        if (errorInsert) throw errorInsert

        siguienteOrden += 1
        hayNuevas = true
      } catch (err) {
        setError(err?.message ?? `Error al subir "${file.name}"`)
      }
    }

    setSubiendo(null)
    if (hayNuevas) await cargarFotos()
  }

  const handleSeleccionArchivos = (e) => {
    const archivos = e.target.files
    e.target.value = ''
    procesarArchivos(archivos)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    if (subiendo) return
    dragCounter.current += 1
    setArrastrando(true)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    if (subiendo) return
    dragCounter.current = Math.max(0, dragCounter.current - 1)
    if (dragCounter.current === 0) setArrastrando(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    dragCounter.current = 0
    setArrastrando(false)
    if (subiendo) return
    procesarArchivos(e.dataTransfer.files)
  }

  const handleEliminar = async (foto) => {
    if (!window.confirm('¿Eliminar esta foto?')) return
    setError(null)
    try {
      const { error: errorStorage } = await supabase.storage.from(BUCKET).remove([foto.path])
      if (errorStorage) throw errorStorage
      const { error: errorDelete } = await supabase
        .from('referenciales_rai_fotos')
        .delete()
        .eq('id', foto.id)
      if (errorDelete) throw errorDelete
      setFotos(prev => {
        const restantes = prev.filter(f => f.id !== foto.id)
        setLightboxIndex(i => {
          if (i == null) return null
          if (restantes.length === 0) return null
          return Math.min(i, restantes.length - 1)
        })
        return restantes
      })
    } catch (err) {
      setError(err?.message ?? 'Error al eliminar la foto')
    }
  }

  const irAnterior = () => setLightboxIndex(i => (i - 1 + fotos.length) % fotos.length)
  const irSiguiente = () => setLightboxIndex(i => (i + 1) % fotos.length)

  return (
    <div className="fotos-seccion">
      {editable && (
        <div
          className={`fotos-dropzone${arrastrando ? ' fotos-dropzone-activa' : ''}${subiendo ? ' fotos-dropzone-disabled' : ''}`}
          onClick={() => !subiendo && inputRef.current?.click()}
          onKeyDown={e => {
            if (!subiendo && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Arrastra tus fotos aquí o haz clic para seleccionar"
        >
          {subiendo ? (
            <>
              <span className="spinner spinner-dark" />
              <span className="fotos-dropzone-texto">
                {subiendo.etapa === 'comprimiendo' ? 'Comprimiendo' : 'Subiendo'} {subiendo.actual}/{subiendo.total}…
              </span>
            </>
          ) : (
            <>
              <IconImagen />
              <span className="fotos-dropzone-texto">Arrastra tus fotos aquí</span>
              <span className="fotos-dropzone-subtexto">o haz clic para seleccionar</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,.heic,.heif"
            multiple
            hidden
            onChange={handleSeleccionArchivos}
          />
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      {resultadosCompresion.length > 0 && (
        <ul className="fotos-compresion">
          {resultadosCompresion.map((r, i) => (
            <li key={i} className="fotos-compresion-item">
              <span className="fotos-compresion-nombre" title={r.nombre}>{r.nombre}</span>
              {r.comprimido ? (
                <span>
                  <span className="fotos-compresion-original">{fmtBytes(r.originalSize)}</span>
                  {' → '}
                  <span className="fotos-compresion-final">{fmtBytes(r.compressedSize)}</span>
                  <span className="fotos-compresion-ahorro">
                    −{Math.round((1 - r.compressedSize / r.originalSize) * 100)}%
                  </span>
                </span>
              ) : (
                <span className="fotos-compresion-final">{fmtBytes(r.originalSize)} (sin cambios)</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {cargando ? (
        <div className="fotos-vacio">Cargando fotos…</div>
      ) : fotos.length === 0 ? (
        <div className="fotos-vacio">Sin fotos todavía.</div>
      ) : (
        <div className="fotos-grid">
          {fotos.map((foto, i) => (
            <div
              key={foto.id}
              className="fotos-item"
              onClick={() => setLightboxIndex(i)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxIndex(i) } }}
              aria-label={`Ver foto ${i + 1} en tamaño completo`}
            >
              {urls[foto.path]
                ? <img src={urls[foto.path]} alt={foto.nombre || 'Foto del referencial'} loading="lazy" />
                : <div className="fotos-item-sin-url" />}
              <button
                type="button"
                className="fotos-item-eliminar"
                onClick={e => { e.stopPropagation(); handleEliminar(foto) }}
                title="Eliminar foto"
              ><IconX /></button>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex != null && fotos[lightboxIndex] && (
        <div
          className="lightbox-overlay"
          onClick={e => { if (e.target === e.currentTarget) setLightboxIndex(null) }}
        >
          <span className="lightbox-contador">{lightboxIndex + 1} / {fotos.length}</span>

          <button type="button" className="lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M2 2L14 14M14 2L2 14" />
            </svg>
          </button>

          {fotos.length > 1 && (
            <>
              <button type="button" className="lightbox-nav lightbox-nav-prev" onClick={irAnterior} aria-label="Foto anterior">
                <IconChevron />
              </button>
              <button type="button" className="lightbox-nav lightbox-nav-next" onClick={irSiguiente} aria-label="Foto siguiente">
                <IconChevron flip />
              </button>
            </>
          )}

          {urls[fotos[lightboxIndex].path] && (
            <img
              className="lightbox-img"
              src={urls[fotos[lightboxIndex].path]}
              alt={fotos[lightboxIndex].nombre || 'Foto del referencial'}
            />
          )}

          <button
            type="button"
            className="lightbox-eliminar"
            onClick={() => handleEliminar(fotos[lightboxIndex])}
          >
            <IconTrash /> Eliminar foto
          </button>
        </div>
      )}
    </div>
  )
}
