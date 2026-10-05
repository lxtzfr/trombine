import type { Area } from 'react-easy-crop'

// Format officiel photo d'identité (mm)
export const PHOTO_W = 35
export const PHOTO_H = 45
export const PHOTO_ASPECT = PHOTO_W / PHOTO_H
// Hauteur du visage, du bas du menton au sommet du crâne (mm)
export const FACE_MIN = 32
export const FACE_MAX = 36
// Position du menton depuis le bas de la photo (mm)
export const CHIN_FROM_BOTTOM = 7

const MM_PER_INCH = 25.4
export const PRINT_DPI = 600
export const PRINT_WIDTH_PX = Math.round((PHOTO_W / MM_PER_INCH) * PRINT_DPI)
export const THUMB_WIDTH_PX = 350

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible'))
    img.src = src
  })
}

/** Plus grand cadre 35×45 centré dans l'image. */
export function defaultArea(width: number, height: number): Area {
  const cropWidth = Math.min(width, height * PHOTO_ASPECT)
  const cropHeight = cropWidth / PHOTO_ASPECT
  return {
    x: (width - cropWidth) / 2,
    y: (height - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  }
}

/**
 * Rend la zone recadrée sur un canvas 35×45.
 * `area` est exprimée dans le repère de la boîte englobante de l'image
 * pivotée (convention de react-easy-crop). Ce qui dépasse de l'image est blanc.
 */
export function renderCrop(
  img: HTMLImageElement,
  area: Area,
  rotation: number,
  outWidth: number,
): HTMLCanvasElement {
  const rad = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const boxWidth = cos * img.naturalWidth + sin * img.naturalHeight
  const boxHeight = sin * img.naturalWidth + cos * img.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = Math.round(outWidth / PHOTO_ASPECT)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponible')

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingQuality = 'high'

  const scale = canvas.width / area.width
  ctx.scale(scale, scale)
  ctx.translate(-area.x, -area.y)
  ctx.translate(boxWidth / 2, boxHeight / 2)
  ctx.rotate(rad)
  ctx.translate(-img.naturalWidth / 2, -img.naturalHeight / 2)
  ctx.drawImage(img, 0, 0)

  return canvas
}

/** Recadrage de chaque personne ayant au moins un exemplaire, indexé par id. */
export async function renderPersonCrops(
  persons: { id: string; src: string; area: Area; rotation: number; copies: number }[],
  outWidth: number,
): Promise<Map<string, HTMLCanvasElement>> {
  const crops = new Map<string, HTMLCanvasElement>()
  for (const person of persons) {
    if (person.copies <= 0) continue
    const img = await loadImage(person.src)
    crops.set(person.id, renderCrop(img, person.area, person.rotation, outWidth))
  }
  return crops
}
