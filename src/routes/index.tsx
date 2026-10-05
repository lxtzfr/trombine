import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Alert,
  Button,
  Container,
  Grid,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import {
  IconAlertTriangle,
  IconFileTypePdf,
  IconFileTypePng,
  IconId,
  IconPhotoPlus,
  IconPrinter,
  IconTrash,
} from '@tabler/icons-react'
import { CropModal } from '#/components/CropModal'
import type { CropResult } from '#/components/CropModal'
import { PersonCard } from '#/components/PersonCard'
import { SheetPreview } from '#/components/SheetPreview'
import {
  FACE_MAX,
  FACE_MIN,
  PHOTO_H,
  PHOTO_W,
  THUMB_WIDTH_PX,
  defaultArea,
  loadImage,
  renderCrop,
} from '#/lib/image'
import { computeLayout } from '#/lib/layout'
import type { CutMarks, SheetSettings } from '#/lib/layout'
import { clearSheet, deletePhoto, loadSheet, savePhoto, saveSheet } from '#/lib/storage'
import type { Person } from '#/lib/types'

export const Route = createFileRoute('/')({ component: Home })

type ExportFormat = 'pdf' | 'png'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const CUT_MARKS_OPTIONS: { value: CutMarks; label: string }[] = [
  { value: 'none', label: 'Aucun' },
  { value: 'outline', label: 'Contour de chaque photo' },
  { value: 'extended', label: "Prolongés jusqu'au bord de la feuille" },
]
const DEFAULT_COPIES = 4
const SAVE_DELAY_MS = 300
const DEFAULT_SETTINGS: SheetSettings = {
  margin: 10,
  gap: 2,
  cutMarks: 'outline',
  newRowPerPerson: false,
}

function makeThumb(img: HTMLImageElement, { area, rotation }: CropResult) {
  return renderCrop(img, area, rotation, THUMB_WIDTH_PX).toDataURL('image/jpeg', 0.85)
}

function Home() {
  const [persons, setPersons] = useState<Person[]>([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<ExportFormat | null>(null)
  // Tant que la planche enregistrée n'est pas relue, on ne sauvegarde rien par-dessus
  const [restored, setRestored] = useState(false)

  const reportStorageError = () =>
    setError("Sauvegarde dans le navigateur indisponible : la planche ne sera pas conservée.")

  useEffect(() => {
    loadSheet()
      .then((saved) => {
        setPersons(saved.persons)
        if (saved.settings) setSettings({ ...DEFAULT_SETTINGS, ...saved.settings })
      })
      .catch(reportStorageError)
      .finally(() => setRestored(true))
  }, [])

  useEffect(() => {
    if (!restored) return
    const timer = setTimeout(
      () => saveSheet(persons, settings).catch(reportStorageError),
      SAVE_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [restored, persons, settings])

  const layout = computeLayout(persons, settings)
  const totalPhotos = persons.reduce((sum, person) => sum + person.copies, 0)
  const editing = persons.find((person) => person.id === editingId) ?? null
  const nextToCrop = (afterId: string) =>
    persons.find((person) => !person.cropped && person.id !== afterId)

  const updateSettings = (patch: Partial<SheetSettings>) =>
    setSettings((current) => ({ ...current, ...patch }))

  const updatePerson = (id: string, patch: Partial<Person>) =>
    setPersons((current) =>
      current.map((person) => (person.id === id ? { ...person, ...patch } : person)),
    )

  const addFiles = async (files: File[]) => {
    setError(null)
    const added: Person[] = []
    const failed: string[] = []
    for (const file of files) {
      const src = URL.createObjectURL(file)
      try {
        const img = await loadImage(src)
        const crop = { area: defaultArea(img.naturalWidth, img.naturalHeight), rotation: 0 }
        const id = crypto.randomUUID()
        await savePhoto(id, file).catch(reportStorageError)
        added.push({
          id,
          name: `Personne ${persons.length + added.length + 1}`,
          src,
          ...crop,
          copies: DEFAULT_COPIES,
          thumb: makeThumb(img, crop),
          cropped: false,
        })
      } catch {
        URL.revokeObjectURL(src)
        failed.push(file.name)
      }
    }
    if (failed.length > 0) setError(`Impossible de lire : ${failed.join(', ')}`)
    if (added.length === 0) return
    setPersons((current) => [...current, ...added])
    setEditingId((current) => current ?? added[0].id)
  }

  const removePerson = (id: string) => {
    const person = persons.find((candidate) => candidate.id === id)
    if (person) URL.revokeObjectURL(person.src)
    setPersons((current) => current.filter((candidate) => candidate.id !== id))
    deletePhoto(id).catch(reportStorageError)
  }

  const clearAll = () => {
    for (const person of persons) URL.revokeObjectURL(person.src)
    setPersons([])
    setSettings(DEFAULT_SETTINGS)
    setEditingId(null)
    clearSheet().catch(reportStorageError)
  }

  const saveCrop = async (id: string, crop: CropResult) => {
    const person = persons.find((candidate) => candidate.id === id)
    if (!person) return
    const img = await loadImage(person.src)
    updatePerson(id, { ...crop, thumb: makeThumb(img, crop), cropped: true })
    setEditingId(nextToCrop(id)?.id ?? null)
  }

  const downloadSheet = async (format: ExportFormat) => {
    setError(null)
    setGenerating(format)
    try {
      if (format === 'pdf') {
        const { generatePdf } = await import('#/lib/pdf')
        await generatePdf(persons, settings)
      } else {
        const { generatePng } = await import('#/lib/png')
        await generatePng(persons, settings)
      }
    } catch (cause) {
      setError(`Échec de l'export : ${cause instanceof Error ? cause.message : cause}`)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Group gap="xs">
            <IconId size={32} />
            <Title order={1} size="h2">
              Trombine
            </Title>
          </Group>
          <Text c="dimmed" size="sm">
            Format {PHOTO_W} × {PHOTO_H} mm, visage de {FACE_MIN} à {FACE_MAX} mm du menton au
            sommet du crâne. Planche A4 prête à imprimer. Photos et cadrages restent
            dans votre navigateur, où ils sont conservés d'une visite à l'autre.
          </Text>
        </div>

        {error && (
          <Alert
            color="red"
            icon={<IconAlertTriangle size={18} />}
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Grid gap="xl">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <Dropzone
                onDrop={addFiles}
                onReject={() => setError('Format non pris en charge (JPEG, PNG ou WebP).')}
                accept={ACCEPTED_TYPES}
              >
                <Group justify="center" gap="md" mih={90} style={{ pointerEvents: 'none' }}>
                  <IconPhotoPlus size={36} stroke={1.5} />
                  <div>
                    <Text fw={500}>Ajouter des photos</Text>
                    <Text size="sm" c="dimmed">
                      Glissez-déposez ou cliquez — une photo par personne
                    </Text>
                  </div>
                </Group>
              </Dropzone>

              {persons.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onChange={updatePerson}
                  onCrop={setEditingId}
                  onRemove={removePerson}
                />
              ))}

              <Paper withBorder p="sm">
                <Stack gap="sm">
                  <Text fw={500} size="sm">
                    Mise en page
                  </Text>
                  <Group grow>
                    <NumberInput
                      size="xs"
                      label="Marge (mm)"
                      min={0}
                      max={30}
                      value={settings.margin}
                      onChange={(value) => updateSettings({ margin: Number(value) || 0 })}
                    />
                    <NumberInput
                      size="xs"
                      label="Espacement (mm)"
                      min={0}
                      max={20}
                      value={settings.gap}
                      onChange={(value) => updateSettings({ gap: Number(value) || 0 })}
                    />
                  </Group>
                  <Select
                    size="xs"
                    label="Traits de coupe"
                    allowDeselect={false}
                    data={CUT_MARKS_OPTIONS}
                    value={settings.cutMarks}
                    onChange={(value) => updateSettings({ cutMarks: value as CutMarks })}
                  />
                  <Switch
                    label="Nouvelle ligne pour chaque personne"
                    checked={settings.newRowPerPerson}
                    onChange={(event) =>
                      updateSettings({ newRowPerPerson: event.currentTarget.checked })
                    }
                  />
                </Stack>
              </Paper>

              <Group grow>
                <Button
                  size="md"
                  leftSection={<IconFileTypePdf size={20} />}
                  disabled={totalPhotos === 0 || generating === 'png'}
                  loading={generating === 'pdf'}
                  onClick={() => downloadSheet('pdf')}
                >
                  Télécharger en PDF
                </Button>
                <Button
                  size="md"
                  variant="light"
                  leftSection={<IconFileTypePng size={20} />}
                  disabled={totalPhotos === 0 || generating === 'pdf'}
                  loading={generating === 'png'}
                  onClick={() => downloadSheet('png')}
                >
                  Télécharger en PNG
                </Button>
              </Group>

              {persons.length > 0 && (
                <Button
                  variant="subtle"
                  color="red"
                  leftSection={<IconTrash size={18} />}
                  onClick={clearAll}
                >
                  Tout effacer
                </Button>
              )}

              <Alert color="blue" icon={<IconPrinter size={18} />}>
                Imprimez à 100 % (« taille réelle »), sans « ajuster à la page », sinon les photos
                ne feront plus {PHOTO_W} × {PHOTO_H} mm.
              </Alert>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                {totalPhotos} photo{totalPhotos > 1 ? 's' : ''} · {layout.pages.length || 1} page
                {layout.pages.length > 1 ? 's' : ''} A4 · {layout.cols * layout.rows} photos max
                par page
              </Text>
              <SheetPreview layout={layout} persons={persons} settings={settings} />
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>

      <CropModal
        person={editing}
        hasNext={editing !== null && nextToCrop(editing.id) !== undefined}
        onClose={() => setEditingId(null)}
        onSave={saveCrop}
      />
    </Container>
  )
}
