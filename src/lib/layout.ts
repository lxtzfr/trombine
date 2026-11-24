import type { Size } from './formats'

/**
 * - `outline` : cadre autour de chaque photo
 * - `extended` : traits prolongés jusqu'au bord de la feuille, pour couper à la règle
 */
export type CutMarks = 'none' | 'outline' | 'extended'

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface SheetSettings {
  /** Format de la feuille (mm) */
  page: Size
  /** Preset de la feuille, ou `custom` */
  pagePreset: string
  /** Format de chaque photo (mm) */
  photo: Size
  /** Preset de la photo, ou `custom` */
  photoPreset: string
  /** Marge minimale autour de la planche (mm) */
  margin: number
  /** Espace entre deux photos (mm) */
  gap: number
  cutMarks: CutMarks
  newRowPerPerson: boolean
}

export interface Slot {
  personId: string
  x: number
  y: number
}

export interface SheetLayout {
  pages: Slot[][]
  cols: number
  rows: number
  /** Au moins une photo tient sur la feuille avec ces marges */
  fits: boolean
}

export function computeLayout(
  persons: { id: string; copies: number }[],
  { page, photo, margin, gap, newRowPerPerson }: SheetSettings,
): SheetLayout {
  const fitCols = Math.floor((page.w - 2 * margin + gap) / (photo.w + gap))
  const fitRows = Math.floor((page.h - 2 * margin + gap) / (photo.h + gap))
  const fits = fitCols >= 1 && fitRows >= 1
  const cols = Math.max(1, fitCols)
  const rows = Math.max(1, fitRows)
  const perPage = cols * rows
  const originX = (page.w - (cols * photo.w + (cols - 1) * gap)) / 2

  const cells: (string | null)[] = []
  for (const person of persons) {
    if (person.copies <= 0) continue
    if (newRowPerPerson) {
      while (cells.length % cols !== 0) cells.push(null)
    }
    for (let i = 0; i < person.copies; i++) cells.push(person.id)
  }

  const pages: Slot[][] = []
  cells.forEach((personId, index) => {
    if (personId === null) return
    const pageIndex = Math.floor(index / perPage)
    const inPage = index % perPage
    const page = (pages[pageIndex] ??= [])
    page.push({
      personId,
      x: originX + (inPage % cols) * (photo.w + gap),
      y: margin + Math.floor(inPage / cols) * (photo.h + gap),
    })
  })

  return { pages, cols, rows, fits }
}

/**
 * Traits de coupe prolongés d'une page : un trait par bord de photo, qui part
 * du haut / de la gauche de la feuille et s'arrête une marge après la dernière
 * photo, sans traverser la partie vide de la page.
 */
export function computeCutLines(
  slots: Slot[],
  { page, photo, margin }: Pick<SheetSettings, 'page' | 'photo' | 'margin'>,
): Line[] {
  if (slots.length === 0) return []
  // Arrondi : avec un espacement nul, deux bords voisins doivent se confondre
  const round = (value: number) => Math.round(value * 1000) / 1000
  const xs = new Set<number>()
  const ys = new Set<number>()
  for (const slot of slots) {
    xs.add(round(slot.x)).add(round(slot.x + photo.w))
    ys.add(round(slot.y)).add(round(slot.y + photo.h))
  }
  const left = Math.min(...xs)
  const xEnd = Math.min(page.w, Math.max(...xs) + left)
  const yEnd = Math.min(page.h, Math.max(...ys) + margin)

  return [
    ...[...ys].map((y) => ({ x1: 0, y1: y, x2: xEnd, y2: y })),
    ...[...xs].map((x) => ({ x1: x, y1: 0, x2: x, y2: yEnd })),
  ]
}
