import { ActionIcon, Badge, Button, Card, Group, NumberInput, Stack, TextInput } from '@mantine/core'
import { IconCrop, IconTrash } from '@tabler/icons-react'
import { PHOTO_ASPECT } from '#/lib/image'
import type { Person } from '#/lib/types'

const THUMB_WIDTH = 70
export const MAX_COPIES = 100

interface PersonCardProps {
  person: Person
  onChange: (id: string, patch: Partial<Person>) => void
  onCrop: (id: string) => void
  onRemove: (id: string) => void
}

export function PersonCard({ person, onChange, onCrop, onRemove }: PersonCardProps) {
  return (
    <Card withBorder padding="sm">
      <Group wrap="nowrap" align="flex-start">
        <img
          src={person.thumb}
          alt={person.name}
          width={THUMB_WIDTH}
          height={THUMB_WIDTH / PHOTO_ASPECT}
          style={{ border: '1px solid var(--mantine-color-default-border)', cursor: 'pointer' }}
          onClick={() => onCrop(person.id)}
        />
        <Stack gap="xs" flex={1} miw={0}>
          <Group gap="xs" wrap="nowrap">
            <TextInput
              flex={1}
              size="xs"
              aria-label="Nom"
              value={person.name}
              onChange={(event) => onChange(person.id, { name: event.currentTarget.value })}
            />
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label={`Supprimer ${person.name}`}
              onClick={() => onRemove(person.id)}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
          <Group gap="xs" align="flex-end">
            <NumberInput
              size="xs"
              w={110}
              label="Exemplaires"
              min={0}
              max={MAX_COPIES}
              allowDecimal={false}
              value={person.copies}
              onChange={(value) => onChange(person.id, { copies: Number(value) || 0 })}
            />
            <Button
              size="xs"
              variant="light"
              leftSection={<IconCrop size={16} />}
              onClick={() => onCrop(person.id)}
            >
              Recadrer
            </Button>
            {!person.cropped && (
              <Badge color="orange" variant="light">
                À recadrer
              </Badge>
            )}
          </Group>
        </Stack>
      </Group>
    </Card>
  )
}
