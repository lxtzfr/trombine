import { PHOTO_H, PHOTO_W } from './image'

// A4 portrait (mm)
export const PAGE_W = 210
export const PAGE_H = 297

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
}

export function computeLayout(
  persons: { id: string; copies: number }[],
  { margin, gap, newRowPerPerson }: SheetSettings,
): SheetLayout {
  const cols = Math.max(1, Math.floor((PAGE_W - 2 * margin + gap) / (PHOTO_W + gap)))
  const rows = Math.max(1, Math.floor((PAGE_H - 2 * margin + gap) / (PHOTO_H + gap)))
  const perPage = cols * rows
  const originX = (PAGE_W - (cols * PHOTO_W + (cols - 1) * gap)) / 2

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
      x: originX + (inPage % cols) * (PHOTO_W + gap),
      y: margin + Math.floor(inPage / cols) * (PHOTO_H + gap),
    })
  })

  return { pages, cols, rows }
}

/**
 * Traits de coupe prolongés d'une page : un trait par bord de photo, qui part
 * du haut / de la gauche de la feuille et s'arrête une marge après la dernière
 * photo, sans traverser la partie vide de la page.
 */
export function computeCutLines(slots: Slot[], margin: number): Line[] {
  if (slots.length === 0) return []
  // Arrondi : avec un espacement nul, deux bords voisins doivent se confondre
  const round = (value: number) => Math.round(value * 1000) / 1000
  const xs = new Set<number>()
  const ys = new Set<number>()
  for (const slot of slots) {
    xs.add(round(slot.x)).add(round(slot.x + PHOTO_W))
    ys.add(round(slot.y)).add(round(slot.y + PHOTO_H))
  }
  const left = Math.min(...xs)
  const xEnd = Math.min(PAGE_W, Math.max(...xs) + left)
  const yEnd = Math.min(PAGE_H, Math.max(...ys) + margin)

  return [
    ...[...ys].map((y) => ({ x1: 0, y1: y, x2: xEnd, y2: y })),
    ...[...xs].map((x) => ({ x1: x, y1: 0, x2: x, y2: yEnd })),
  ]
}
