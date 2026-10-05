import type { Area } from 'react-easy-crop'

export interface Person {
  id: string
  name: string
  /** Object URL de la photo d'origine */
  src: string
  /** Zone recadrée en pixels (repère react-easy-crop) */
  area: Area
  rotation: number
  copies: number
  /** Aperçu recadré (data URL) */
  thumb: string
  /** Le cadrage a été validé par l'utilisateur */
  cropped: boolean
}
