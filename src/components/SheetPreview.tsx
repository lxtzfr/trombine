import { Box, Paper, Stack, Text } from '@mantine/core'
import { PHOTO_H, PHOTO_W } from '#/lib/image'
import { PAGE_H, PAGE_W, computeCutLines } from '#/lib/layout'
import type { SheetLayout, SheetSettings } from '#/lib/layout'
import type { Person } from '#/lib/types'

const CUT_COLOR = '#999'
const pct = (value: number, total: number) => `${(value / total) * 100}%`

interface SheetPreviewProps {
  layout: SheetLayout
  persons: Person[]
  settings: SheetSettings
}

export function SheetPreview({ layout, persons, settings }: SheetPreviewProps) {
  const thumbs = new Map(persons.map((person) => [person.id, person.thumb]))
  const pages = layout.pages.length > 0 ? layout.pages : [[]]

  return (
    <Stack gap="md">
      {pages.map((slots, pageIndex) => (
        <Box key={pageIndex}>
          {pages.length > 1 && (
            <Text size="xs" c="dimmed" mb={4}>
              Page {pageIndex + 1} / {pages.length}
            </Text>
          )}
          <Paper
            shadow="md"
            withBorder
            radius={0}
            pos="relative"
            bg="white"
            style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}`, overflow: 'hidden' }}
          >
            {settings.cutMarks === 'extended' &&
              computeCutLines(slots, settings.margin).map((line, index) => (
                <div
                  key={`cut-${index}`}
                  style={{
                    position: 'absolute',
                    left: pct(line.x1, PAGE_W),
                    top: pct(line.y1, PAGE_H),
                    width: pct(line.x2 - line.x1, PAGE_W),
                    height: pct(line.y2 - line.y1, PAGE_H),
                    borderTop: `1px solid ${CUT_COLOR}`,
                    borderLeft: `1px solid ${CUT_COLOR}`,
                  }}
                />
              ))}
            {slots.map((slot, index) => (
              <img
                key={index}
                src={thumbs.get(slot.personId)}
                alt=""
                style={{
                  position: 'absolute',
                  left: pct(slot.x, PAGE_W),
                  top: pct(slot.y, PAGE_H),
                  width: pct(PHOTO_W, PAGE_W),
                  height: pct(PHOTO_H, PAGE_H),
                  outline: settings.cutMarks === 'outline' ? `1px solid ${CUT_COLOR}` : undefined,
                }}
              />
            ))}
          </Paper>
        </Box>
      ))}
    </Stack>
  )
}
