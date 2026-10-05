import { clear, createStore, del, get, keys, set } from 'idb-keyval'
import type { UseStore } from 'idb-keyval'
import type { SheetSettings } from './layout'
import type { Person } from './types'

const STATE_KEY = 'state'
const PHOTO_PREFIX = 'photo:'

type StoredPerson = Omit<Person, 'src'>

interface StoredState {
  persons: StoredPerson[]
  settings: SheetSettings
}

// Ouverture paresseuse : IndexedDB n'existe pas pendant le rendu serveur
let store: UseStore | undefined
const getStore = () => (store ??= createStore('trombine', 'planche'))
const photoKey = (id: string) => `${PHOTO_PREFIX}${id}`

/** La photo d'origine est écrite une seule fois, séparément de l'état. */
export function savePhoto(id: string, photo: Blob) {
  return set(photoKey(id), photo, getStore())
}

export function deletePhoto(id: string) {
  return del(photoKey(id), getStore())
}

export function saveSheet(persons: Person[], settings: SheetSettings) {
  const state: StoredState = {
    persons: persons.map(({ src: _src, ...stored }) => stored),
    settings,
  }
  return set(STATE_KEY, state, getStore())
}

export async function loadSheet(): Promise<{ persons: Person[]; settings?: SheetSettings }> {
  const state = await get<StoredState>(STATE_KEY, getStore())
  const persons: Person[] = []
  for (const stored of state?.persons ?? []) {
    const photo = await get<Blob>(photoKey(stored.id), getStore())
    if (photo) persons.push({ ...stored, src: URL.createObjectURL(photo) })
  }

  // Photos orphelines (onglet fermé avant la sauvegarde de l'état)
  const known = new Set(persons.map((person) => photoKey(person.id)))
  for (const key of await keys(getStore())) {
    if (typeof key === 'string' && key.startsWith(PHOTO_PREFIX) && !known.has(key)) {
      await del(key, getStore())
    }
  }

  return { persons, settings: state?.settings }
}

export function clearSheet() {
  return clear(getStore())
}
