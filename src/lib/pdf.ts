import { aspectOf, printWidthPx, renderPersonCrops } from './image'
import { computeCutLines, computeLayout } from './layout'
import type { SheetSettings } from './layout'
import type { Person } from './types'

export async function generatePdf(persons: Person[], settings: SheetSettings) {
  const { jsPDF } = await import('jspdf')
  const { page, photo } = settings
  // jsPDF intervertit les dimensions si l'orientation ne leur correspond pas
  const doc = new jsPDF({
    unit: 'mm',
    format: [page.w, page.h],
    orientation: page.w > page.h ? 'landscape' : 'portrait',
  })
  const { pages } = computeLayout(persons, settings)

  const crops = await renderPersonCrops(persons, printWidthPx(photo), aspectOf(photo))
  const images = new Map<string, string>()
  for (const [id, canvas] of crops) images.set(id, canvas.toDataURL('image/jpeg', 0.95))

  pages.forEach((slots, pageIndex) => {
    if (pageIndex > 0) doc.addPage()
    doc.setDrawColor(150)
    doc.setLineWidth(0.1)
    // Tracés avant les photos : les traits prolongés passent dessous
    if (settings.cutMarks === 'extended') {
      for (const line of computeCutLines(slots, settings)) {
        doc.line(line.x1, line.y1, line.x2, line.y2)
      }
    }
    for (const slot of slots) {
      const data = images.get(slot.personId)
      if (!data) continue
      // L'alias évite d'embarquer la même image une fois par exemplaire
      doc.addImage(data, 'JPEG', slot.x, slot.y, photo.w, photo.h, slot.personId)
    }
    if (settings.cutMarks === 'outline') {
      for (const slot of slots) doc.rect(slot.x, slot.y, photo.w, photo.h)
    }
  })

  doc.save('planche-photos.pdf')
}
