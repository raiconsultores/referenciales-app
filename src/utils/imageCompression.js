const MAX_BYTES_DEFAULT = 800 * 1024
const MAX_DIMENSION_DEFAULT = 1920
const CALIDAD_INICIAL = 0.92
const CALIDAD_MINIMA = 0.4
const CALIDAD_PASO = 0.1

export function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function cargarImagen(file) {
  if (window.createImageBitmap) {
    return window.createImageBitmap(file)
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = (err) => { URL.revokeObjectURL(url); reject(err) }
    img.src = url
  })
}

function calcularDimensiones(w, h, maxDim) {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h }
  const escala = w >= h ? maxDim / w : maxDim / h
  return { width: Math.round(w * escala), height: Math.round(h * escala) }
}

function canvasABlob(canvas, mime, calidad) {
  return new Promise(resolve => canvas.toBlob(resolve, mime, calidad))
}

/**
 * Comprime una imagen en el navegador (canvas) para que no supere maxBytes,
 * redimensionando al máximo maxDimension en el lado más largo y, para JPEG,
 * bajando la calidad de forma iterativa. PNG no soporta calidad ajustable en
 * canvas, así que solo se beneficia del redimensionado. Si el archivo ya es
 * pequeño, el formato no es compresible por canvas (p. ej. HEIC), o algo
 * falla al decodificar, se devuelve el archivo original sin modificar.
 */
export async function comprimirImagen(file, opts = {}) {
  const maxBytes = opts.maxBytes ?? MAX_BYTES_DEFAULT
  const maxDimension = opts.maxDimension ?? MAX_DIMENSION_DEFAULT
  const originalSize = file.size

  if (originalSize <= maxBytes) {
    return { file, originalSize, compressedSize: originalSize, comprimido: false }
  }

  const esJPEG = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name)
  const esPNG  = file.type === 'image/png'  || /\.png$/i.test(file.name)
  if (!esJPEG && !esPNG) {
    return { file, originalSize, compressedSize: originalSize, comprimido: false }
  }

  try {
    const imagen = await cargarImagen(file)
    const { width, height } = calcularDimensiones(imagen.width, imagen.height, maxDimension)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(imagen, 0, 0, width, height)
    if (imagen.close) imagen.close()

    const mime = esPNG ? 'image/png' : 'image/jpeg'
    let blob

    if (mime === 'image/jpeg') {
      let calidad = CALIDAD_INICIAL
      blob = await canvasABlob(canvas, mime, calidad)
      while (blob && blob.size > maxBytes && calidad > CALIDAD_MINIMA) {
        calidad -= CALIDAD_PASO
        blob = await canvasABlob(canvas, mime, calidad)
      }
    } else {
      // PNG es sin pérdida en canvas: solo el redimensionado reduce el peso.
      blob = await canvasABlob(canvas, mime)
    }

    if (!blob || blob.size >= originalSize) {
      return { file, originalSize, compressedSize: originalSize, comprimido: false }
    }

    const archivoComprimido = new File([blob], file.name, { type: mime, lastModified: Date.now() })
    return { file: archivoComprimido, originalSize, compressedSize: blob.size, comprimido: true }
  } catch {
    return { file, originalSize, compressedSize: originalSize, comprimido: false }
  }
}
