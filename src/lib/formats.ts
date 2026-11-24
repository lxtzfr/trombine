export interface Size {
  /** Largeur (mm) */
  w: number
  /** Hauteur (mm) */
  h: number
}

/** Repères de cadrage du visage (normes photo d'identité). */
export interface FaceGuides {
  /** Hauteur du visage, du bas du menton au sommet du crâne (mm) */
  faceMin: number
  faceMax: number
  /** Position du menton depuis le bas de la photo (mm) */
  chinFromBottom: number
}

export interface Preset extends Size {
  id: string
  label: string
  group: string
  guides?: FaceGuides
}

export const CUSTOM = 'custom'

const MM_PER_INCH = 25.4
const inch = (value: number) => Math.round(value * MM_PER_INCH * 10) / 10

export const PHOTO_PRESETS: Preset[] = [
  {
    id: 'id-fr',
    label: "Identité France / UE — 35 × 45 mm",
    group: 'Identité',
    w: 35,
    h: 45,
    guides: { faceMin: 32, faceMax: 36, chinFromBottom: 7 },
  },
  { id: 'id-us', label: 'Passeport US / Inde — 2 × 2 in (51 × 51 mm)', group: 'Identité', w: inch(2), h: inch(2) },
  { id: 'id-ca', label: 'Passeport Canada — 50 × 70 mm', group: 'Identité', w: 50, h: 70 },
  { id: 'id-cn', label: 'Visa Chine — 33 × 48 mm', group: 'Identité', w: 33, h: 48 },
  { id: 'id-small', label: 'Vignette — 25 × 32 mm', group: 'Identité', w: 25, h: 32 },
  { id: 'wallet', label: 'Portefeuille — 64 × 89 mm', group: 'Tirages', w: 64, h: 89 },
  { id: '9x13', label: '9 × 13 cm', group: 'Tirages', w: 89, h: 127 },
  { id: '10x15', label: '10 × 15 cm', group: 'Tirages', w: 102, h: 152 },
  { id: '13x18', label: '13 × 18 cm', group: 'Tirages', w: 127, h: 178 },
  { id: '15x20', label: '15 × 20 cm', group: 'Tirages', w: 152, h: 203 },
  { id: 'square-5', label: 'Carré 5 × 5 cm', group: 'Carrés', w: 50, h: 50 },
  { id: 'square-10', label: 'Carré 10 × 10 cm', group: 'Carrés', w: 100, h: 100 },
]

export const PAGE_PRESETS: Preset[] = [
  { id: 'a4', label: 'A4 — 210 × 297 mm', group: 'Papier', w: 210, h: 297 },
  { id: 'a3', label: 'A3 — 297 × 420 mm', group: 'Papier', w: 297, h: 420 },
  { id: 'a5', label: 'A5 — 148 × 210 mm', group: 'Papier', w: 148, h: 210 },
  { id: 'letter', label: 'US Letter — 8,5 × 11 in', group: 'Papier', w: inch(8.5), h: inch(11) },
  { id: 'legal', label: 'US Legal — 8,5 × 14 in', group: 'Papier', w: inch(8.5), h: inch(14) },
  { id: 'print-10x15', label: 'Tirage 10 × 15 cm', group: 'Tirage photo', w: 102, h: 152 },
  { id: 'print-13x18', label: 'Tirage 13 × 18 cm', group: 'Tirage photo', w: 127, h: 178 },
  { id: 'print-15x20', label: 'Tirage 15 × 20 cm', group: 'Tirage photo', w: 152, h: 203 },
  { id: 'print-20x30', label: 'Tirage 20 × 30 cm', group: 'Tirage photo', w: 203, h: 305 },
]

export const DEFAULT_PHOTO = PHOTO_PRESETS[0]
export const DEFAULT_PAGE = PAGE_PRESETS[0]

export function findPreset(presets: Preset[], id: string) {
  return presets.find((preset) => preset.id === id)
}

/** Le format correspond au preset, dans un sens ou dans l'autre. */
export function matchesPreset(size: Size, preset: Preset | undefined) {
  if (!preset) return false
  return (size.w === preset.w && size.h === preset.h) || (size.w === preset.h && size.h === preset.w)
}

/** Repères de visage, seulement pour un format d'identité en portrait. */
export function faceGuides(size: Size, presetId: string): FaceGuides | undefined {
  const preset = findPreset(PHOTO_PRESETS, presetId)
  if (!preset?.guides || size.w !== preset.w || size.h !== preset.h) return undefined
  return preset.guides
}

export const formatSize = ({ w, h }: Size) =>
  `${w.toLocaleString('fr-FR')} × ${h.toLocaleString('fr-FR')} mm`
