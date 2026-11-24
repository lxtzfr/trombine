import type { Area } from 'react-easy-crop'

import type { Size } from './formats'

const MM_PER_INCH = 25.4
const PRINT_DPI = 600
// Les grands tirages n'ont pas besoin de 600 ppp : on plafonne la taille du canvas
const MAX_PRINT_SIDE_PX = 4000
export const THUMB_WIDTH_PX = 350

export const aspectOf = ({ w, h }: Size) => w / h

/** Largeur en pixels du rendu d'impression d'une photo. */
export function printWidthPx(photo: Size) {
  const scale = Math.min(PRINT_DPI / MM_PER_INCH, MAX_PRINT_SIDE_PX / Math.max(photo.w, photo.h))
  return Math.round(photo.w * scale)
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible'))
    img.src = src
  })
}

/** Plus grand cadre au ratio `aspect` centré dans l'image. */
export function defaultArea(width: number, height: number, aspect: number): Area {
  const cropWidth = Math.min(width, height * aspect)
  const cropHeight = cropWidth / aspect
  return {
    x: (width - cropWidth) / 2,
    y: (height - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  }
}

/**
 * Même centre et même surface, nouveau ratio : le cadrage d'une photo suit
 * un changement de format sans repartir de zéro.
 */
export function refitArea(area: Area, aspect: number): Area {
  const surface = area.width * area.height
  const width = Math.sqrt(surface * aspect)
  const height = width / aspect
  return {
    x: area.x + (area.width - width) / 2,
    y: area.y + (area.height - height) / 2,
    width,
    height,
  }
}

/**
 * Rend la zone recadrée sur un canvas au ratio `aspect`.
 * `area` est exprimée dans le repère de la boîte englobante de l'image
 * pivotée (convention de react-easy-crop). Ce qui dépasse de l'image est blanc.
 */
export function renderCrop(
  img: HTMLImageElement,
  area: Area,
  rotation: number,
  outWidth: number,
  aspect: number,
): HTMLCanvasElement {
  const rad = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const boxWidth = cos * img.naturalWidth + sin * img.naturalHeight
  const boxHeight = sin * img.naturalWidth + cos * img.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = outWidth
  canvas.height = Math.round(outWidth / aspect)
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
  aspect: number,
): Promise<Map<string, HTMLCanvasElement>> {
  const crops = new Map<string, HTMLCanvasElement>()
  for (const person of persons) {
    if (person.copies <= 0) continue
    const img = await loadImage(person.src)
    crops.set(person.id, renderCrop(img, person.area, person.rotation, outWidth, aspect))
  }
  return crops
}
