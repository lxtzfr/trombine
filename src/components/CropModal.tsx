import { useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { ActionIcon, Box, Button, Group, Modal, Slider, Stack, Text, Tooltip } from '@mantine/core'
import { useElementSize } from '@mantine/hooks'
import {
  IconCheck,
  IconRotate2,
  IconRotateClockwise2,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react'
import {
  CHIN_FROM_BOTTOM,
  FACE_MAX,
  FACE_MIN,
  PHOTO_ASPECT,
  PHOTO_H,
  PHOTO_W,
} from '#/lib/image'
import type { Person } from '#/lib/types'

const MAX_PX_PER_MM = 9
const STAGE_PADDING = 24
const MIN_ZOOM = 0.3
const MAX_ZOOM = 10
const GUIDE_COLOR = 'rgba(64, 192, 87, 0.95)'

export interface CropResult {
  area: Area
  rotation: number
}

interface CropModalProps {
  person: Person | null
  hasNext: boolean
  onClose: () => void
  onSave: (id: string, result: CropResult) => void
}

export function CropModal({ person, hasNext, onClose, onSave }: CropModalProps) {
  return (
    <Modal
      opened={person !== null}
      onClose={onClose}
      title={person ? `Recadrer — ${person.name}` : ''}
      size="lg"
      centered
    >
      {person && (
        <CropEditor key={person.id} person={person} hasNext={hasNext} onSave={onSave} />
      )}
    </Modal>
  )
}

function CropEditor({ person, hasNext, onSave }: Omit<CropModalProps, 'onClose'> & { person: Person }) {
  const { ref, width } = useElementSize()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const initialQuarter = Math.round(person.rotation / 90) * 90
  const [quarter, setQuarter] = useState(initialQuarter)
  const [tilt, setTilt] = useState(person.rotation - initialQuarter)
  const [area, setArea] = useState(person.area)

  const rotation = quarter + tilt
  const pxPerMm = Math.min(MAX_PX_PER_MM, (width - 2 * STAGE_PADDING) / PHOTO_W)
  const cropSize = { width: PHOTO_W * pxPerMm, height: PHOTO_H * pxPerMm }

  return (
    <Stack gap="md">
      <Box
        ref={ref}
        pos="relative"
        h={PHOTO_H * MAX_PX_PER_MM + 2 * STAGE_PADDING}
        bg="dark.7"
        style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}
      >
        {width > 0 && (
          <>
            <Cropper
              image={person.src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={PHOTO_ASPECT}
              cropSize={cropSize}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              zoomSpeed={0.3}
              restrictPosition={false}
              showGrid={false}
              initialCroppedAreaPixels={person.area}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
            <FaceGuides pxPerMm={pxPerMm} />
          </>
        )}
      </Box>

      <Text size="sm" c="dimmed">
        Placez le bas du menton sur la ligne du bas et le sommet du crâne (hors chevelure) dans la
        bande verte : le visage mesurera alors entre {FACE_MIN} et {FACE_MAX} mm.
      </Text>

      <Group gap="sm" wrap="nowrap">
        <IconZoomOut size={18} />
        <Slider
          flex={1}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={setZoom}
          label={(value) => `×${value.toFixed(2)}`}
          aria-label="Zoom"
        />
        <IconZoomIn size={18} />
      </Group>

      <Group gap="sm" wrap="nowrap">
        <Tooltip label="Pivoter de 90° à gauche">
          <ActionIcon
            variant="default"
            aria-label="Pivoter de 90° à gauche"
            onClick={() => setQuarter((q) => q - 90)}
          >
            <IconRotate2 size={18} />
          </ActionIcon>
        </Tooltip>
        <Slider
          flex={1}
          min={-20}
          max={20}
          step={0.5}
          value={tilt}
          onChange={setTilt}
          label={(value) => `${value}°`}
          marks={[{ value: 0 }]}
          aria-label="Redresser"
        />
        <Tooltip label="Pivoter de 90° à droite">
          <ActionIcon
            variant="default"
            aria-label="Pivoter de 90° à droite"
            onClick={() => setQuarter((q) => q + 90)}
          >
            <IconRotateClockwise2 size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group justify="flex-end">
        <Button
          leftSection={<IconCheck size={18} />}
          onClick={() => onSave(person.id, { area, rotation })}
        >
          {hasNext ? 'Valider et passer à la suivante' : 'Valider'}
        </Button>
      </Group>
    </Stack>
  )
}

function FaceGuides({ pxPerMm }: { pxPerMm: number }) {
  const chinY = (PHOTO_H - CHIN_FROM_BOTTOM) * pxPerMm
  const crownTop = (PHOTO_H - CHIN_FROM_BOTTOM - FACE_MAX) * pxPerMm
  const crownHeight = (FACE_MAX - FACE_MIN) * pxPerMm
  const label = {
    position: 'absolute',
    right: 4,
    fontSize: 10,
    lineHeight: 1,
    color: '#fff',
    textShadow: '0 0 3px #000',
  } as const

  return (
    <Box
      pos="absolute"
      top="50%"
      left="50%"
      w={PHOTO_W * pxPerMm}
      h={PHOTO_H * pxPerMm}
      style={{ transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
    >
      <Box
        pos="absolute"
        left={0}
        right={0}
        top={crownTop}
        h={crownHeight}
        style={{
          background: 'rgba(64, 192, 87, 0.3)',
          borderTop: `1px solid ${GUIDE_COLOR}`,
          borderBottom: `1px solid ${GUIDE_COLOR}`,
        }}
      />
      <span style={{ ...label, top: crownTop + crownHeight + 3 }}>Sommet du crâne</span>
      <Box
        pos="absolute"
        left={0}
        right={0}
        top={chinY}
        style={{ borderTop: `2px solid ${GUIDE_COLOR}` }}
      />
      <span style={{ ...label, top: chinY + 4 }}>Menton</span>
      <Box
        pos="absolute"
        top={0}
        bottom={0}
        left="50%"
        style={{ borderLeft: '1px dashed rgba(255, 255, 255, 0.6)' }}
      />
    </Box>
  )
}
