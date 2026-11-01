import { afterEach, describe, expect, it } from 'vitest'
import type { LogoSelection } from '../../../src/data/models'
import { auditSlide } from '../../../src/slides/engine'
import { SLIDE_STYLES } from '../../../src/slides/styles'
import { PRESET_THEMES } from '../../../src/slides/themes'
import type { AnnouncementInput } from '../../../src/slides/templates/contract'
import { buildSlides } from '../../../src/slides/templates/registry'
import { FULL, MINIMAL, NORMAL, TEXT_TYPE_IDS, longTitle, type TextTypeId } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'
import { cleanupMounted } from '../helpers/mount'
import { renderSlide } from '../helpers/slides'

afterEach(cleanupMounted)

const IGLESIA: LogoSelection = { kind: 'iglesia' }

describe.each(SLIDE_STYLES.map((s) => s.id))('Clásica · estilo %s', (slideStyle) => {
  const render = (typeId: TextTypeId, values: Record<string, unknown>, extra: Partial<AnnouncementInput> = {}, ctx = makeCtx()) => {
    const [spec] = buildSlides({ typeId, templateId: 'clasica', values, logo: IGLESIA, slideStyle, ...extra }, ctx)
    return renderSlide(spec!, ctx)
  }

  for (const typeId of TEXT_TYPE_IDS) {
    it(`${typeId} normal → ok y sin violaciones de §5`, async () => {
      const { status, canvas } = await render(typeId, NORMAL[typeId])
      expect(status).toEqual({ status: 'ok', offendingFields: [] })
      expect(auditSlide(canvas)).toEqual([])
    })

    it(`${typeId} solo obligatorios → ok, sin textos vacíos`, async () => {
      const { status, canvas } = await render(typeId, MINIMAL[typeId])
      expect(status.status).toBe('ok')
      for (const el of canvas.querySelectorAll('[data-role]')) expect(el.textContent!.trim()).not.toBe('')
      expect(auditSlide(canvas)).toEqual([])
    })
  }

  it('título de 95 caracteres → No cabe por el título', async () => {
    const { status } = await render('actividad', longTitle('actividad'))
    expect(status).toEqual({ status: 'no_cabe', offendingFields: ['titulo'], reason: 'fit' })
  })

  it('salida con todo lleno (7 filas) → No cabe por densidad, en contacto', async () => {
    const { status } = await render('salida', FULL.salida)
    expect(status).toEqual({ status: 'no_cabe', offendingFields: ['contacto'], reason: 'density' })
  })

  // Himnario y Cartel ponen el logo al pie de la columna de fecha, que se sostiene sola; el Almanaque
  // lo pone en la cabecera de la hoja, y ahí el emblema del tipo evita una cabecera vacía (§10.7).
  it('logo "ninguno" → sin logo ni cabecera vacía', async () => {
    const { status, canvas } = await render('obra_misionera', NORMAL.obra_misionera, { logo: { kind: 'ninguno' } })
    expect(status.status).toBe('ok')
    expect(canvas.querySelector('[data-logo]')).toBeNull()
    if (slideStyle === 'almanaque') expect(canvas.querySelector('[data-emblem]')).not.toBeNull()
    expect(auditSlide(canvas)).toEqual([])
  })

  it('tema claro y color personalizado de bajo contraste → sin violaciones', async () => {
    const cielo = makeCtx({ theme: PRESET_THEMES.find((t) => t.id === 'cielo')! })
    expect(auditSlide((await render('culto', NORMAL.culto, {}, cielo)).canvas)).toEqual([])
    cleanupMounted()
    expect(auditSlide((await render('culto', NORMAL.culto, { customPrimaryColor: '#fff59d' })).canvas)).toEqual([])
  })
})
