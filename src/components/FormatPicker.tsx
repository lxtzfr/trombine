import { ActionIcon, Group, NumberInput, Select, Stack, Tooltip } from '@mantine/core'
import { IconArrowsExchange } from '@tabler/icons-react'
import { CUSTOM, findPreset } from '#/lib/formats'
import type { Preset, Size } from '#/lib/formats'

const MIN_MM = 5
const MAX_MM = 1000

interface FormatPickerProps {
  label: string
  presets: Preset[]
  presetId: string
  size: Size
  swapLabel: string
  onChange: (size: Size, presetId: string) => void
}

function selectData(presets: Preset[]) {
  const groups = new Map<string, { value: string; label: string }[]>()
  for (const preset of presets) {
    const items = groups.get(preset.group) ?? []
    items.push({ value: preset.id, label: preset.label })
    groups.set(preset.group, items)
  }
  return [
    ...[...groups].map(([group, items]) => ({ group, items })),
    { group: 'Autre', items: [{ value: CUSTOM, label: 'Personnalisé' }] },
  ]
}

/** Choix d'un format : preset courant ou dimensions libres, avec inversion largeur / hauteur. */
export function FormatPicker({ label, presets, presetId, size, swapLabel, onChange }: FormatPickerProps) {
  const selectPreset = (id: string | null) => {
    if (!id || id === CUSTOM) return onChange(size, CUSTOM)
    const preset = findPreset(presets, id)
    if (!preset) return
    // On conserve l'orientation choisie (les presets sont en portrait)
    const short = Math.min(preset.w, preset.h)
    const long = Math.max(preset.w, preset.h)
    onChange(size.w > size.h ? { w: long, h: short } : { w: short, h: long }, id)
  }

  const setSide = (side: keyof Size, value: string | number) => {
    const mm = Number(value)
    if (!Number.isFinite(mm) || mm < MIN_MM) return
    onChange({ ...size, [side]: mm }, CUSTOM)
  }

  return (
    <Stack gap={6}>
      <Select
        size="xs"
        label={label}
        allowDeselect={false}
        searchable
        data={selectData(presets)}
        value={presetId}
        onChange={selectPreset}
      />
      <Group gap="xs" wrap="nowrap" align="flex-end">
        <NumberInput
          size="xs"
          flex={1}
          label="Largeur (mm)"
          min={MIN_MM}
          max={MAX_MM}
          decimalScale={1}
          decimalSeparator=","
          value={size.w}
          onChange={(value) => setSide('w', value)}
        />
        <Tooltip label={swapLabel}>
          <ActionIcon
            variant="default"
            size="input-xs"
            aria-label={swapLabel}
            onClick={() => onChange({ w: size.h, h: size.w }, presetId)}
          >
            <IconArrowsExchange size={16} />
          </ActionIcon>
        </Tooltip>
        <NumberInput
          size="xs"
          flex={1}
          label="Hauteur (mm)"
          min={MIN_MM}
          max={MAX_MM}
          decimalScale={1}
          decimalSeparator=","
          value={size.h}
          onChange={(value) => setSide('h', value)}
        />
      </Group>
    </Stack>
  )
}
