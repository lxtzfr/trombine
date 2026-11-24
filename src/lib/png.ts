import { aspectOf, renderPersonCrops } from './image'
import { computeCutLines, computeLayout } from './layout'
import type { Size } from './formats'
import type { SheetSettings } from './layout'
import type { Person } from './types'

const MM_PER_INCH = 25.4
const MAX_DPI = 300
// Taille maximale de canvas de Safari iOS (pixels)
const MAX_CANVAS_AREA = 16_000_000
const PNG_SIGNATURE_AND_IHDR = 33

/** 300 ppp, moins pour les grandes feuilles qui dépasseraient la limite de Safari. */
function pngDpi(page: Size) {
  const areaInches = (page.w / MM_PER_INCH) * (page.h / MM_PER_INCH)
  return Math.min(MAX_DPI, Math.floor(Math.sqrt(MAX_CANVAS_AREA / areaInches)))
}

function crc32(bytes: Uint8Array) {
  let crc = ~0
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return ~crc >>> 0
}

/**
 * Insère un chunk pHYs après IHDR : sans lui le PNG n'a pas de résolution
 * et s'imprime à une taille arbitraire.
 */
async function withDpi(blob: Blob, dpi: number): Promise<Blob> {
  const png = new Uint8Array(await blob.arrayBuffer())
  const chunk = new Uint8Array(21)
  const view = new DataView(chunk.buffer)
  const pxPerMeter = Math.round(dpi / 0.0254)
  view.setUint32(0, 9)
  chunk.set([0x70, 0x48, 0x59, 0x73], 4) // "pHYs"
  view.setUint32(8, pxPerMeter)
  view.setUint32(12, pxPerMeter)
  view.setUint8(16, 1) // unité : mètre
  view.setUint32(17, crc32(chunk.subarray(4, 17)))
  return new Blob(
    [png.subarray(0, PNG_SIGNATURE_AND_IHDR), chunk, png.subarray(PNG_SIGNATURE_AND_IHDR)],
    { type: 'image/png' },
  )
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Une image PNG par page de la planche. */
export async function generatePng(persons: Person[], settings: SheetSettings) {
  const { page, photo } = settings
  const dpi = pngDpi(page)
  const px = (mm: number) => Math.round((mm * dpi) / MM_PER_INCH)
  const { pages } = computeLayout(persons, settings)
  const crops = await renderPersonCrops(persons, px(photo.w), aspectOf(photo))

  for (const [pageIndex, slots] of pages.entries()) {
    const canvas = document.createElement('canvas')
    canvas.width = px(page.w)
    canvas.height = px(page.h)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponible')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#969696'
    ctx.lineWidth = 1

    // Tracés avant les photos : les traits prolongés passent dessous
    if (settings.cutMarks === 'extended') {
      ctx.beginPath()
      for (const line of computeCutLines(slots, settings)) {
        ctx.moveTo(px(line.x1) + 0.5, px(line.y1) + 0.5)
        ctx.lineTo(px(line.x2) + 0.5, px(line.y2) + 0.5)
      }
      ctx.stroke()
    }

    for (const slot of slots) {
      const crop = crops.get(slot.personId)
      if (!crop) continue
      const x = px(slot.x)
      const y = px(slot.y)
      ctx.drawImage(crop, x, y)
      if (settings.cutMarks === 'outline') ctx.strokeRect(x + 0.5, y + 0.5, crop.width - 1, crop.height - 1)
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('Export PNG impossible')
    const suffix = pages.length > 1 ? `-${pageIndex + 1}` : ''
    download(await withDpi(blob, dpi), `planche-photos${suffix}.png`)
  }
}
