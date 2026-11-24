import { Box, Paper, Stack, Text } from '@mantine/core'
import { computeCutLines } from '#/lib/layout'
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
  const { page, photo } = settings
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
            style={{ aspectRatio: `${page.w} / ${page.h}`, overflow: 'hidden' }}
          >
            {settings.cutMarks === 'extended' &&
              computeCutLines(slots, settings).map((line, index) => (
                <div
                  key={`cut-${index}`}
                  style={{
                    position: 'absolute',
                    left: pct(line.x1, page.w),
                    top: pct(line.y1, page.h),
                    width: pct(line.x2 - line.x1, page.w),
                    height: pct(line.y2 - line.y1, page.h),
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
                  left: pct(slot.x, page.w),
                  top: pct(slot.y, page.h),
                  width: pct(photo.w, page.w),
                  height: pct(photo.h, page.h),
                  objectFit: 'cover',
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
