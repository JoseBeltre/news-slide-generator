import { describe, expect, it } from 'vitest'
import { buildSlides } from '../../../src/slides/templates/registry'
import { PRESET_THEMES, resolveTheme } from '../../../src/slides/themes'
import { NORMAL } from '../../fixtures/announcements'
import { makeCtx } from '../../fixtures/context'

const ctx = makeCtx()
const culto = (extra: Record<string, unknown> = {}) =>
  buildSlides({ typeId: 'culto', templateId: 'clasica', values: NORMAL.culto, logo: { kind: 'iglesia' }, ...extra }, ctx)[0]!

describe('buildSlides (P4)', () => {
  it('slide de imagen sin imagen → ninguna slide (nunca el id "undefined", RNF-10)', () => {
    expect(buildSlides({ typeId: 'imagen', templateId: 'imagen', values: {}, logo: { kind: 'ninguno' } }, ctx)).toEqual([])
    expect(buildSlides({ typeId: 'imagen', templateId: 'imagen', values: { imagen: 'abc' }, logo: { kind: 'ninguno' } }, ctx)).toEqual([
      { kind: 'image', imageId: 'abc' },
    ])
  })

  it('themeId elige un tema predefinido para el anuncio (RF-31)', () => {
    const vino = PRESET_THEMES.find((t) => t.id === 'vino')!
    const spec = culto({ themeId: 'vino' })
    expect('palette' in spec && spec.palette).toEqual(resolveTheme(vino, 'culto').palette)
  })

  it('el color propio manda sobre el tema; un themeId desconocido usa el de la iglesia', () => {
    const custom = culto({ themeId: 'vino', customPrimaryColor: '#1e5aa8' })
    const vino = culto({ themeId: 'vino' })
    expect('palette' in custom && 'palette' in vino && custom.palette).not.toEqual('palette' in vino && vino.palette)
    const unknown = culto({ themeId: 'no-existe' })
    const church = culto()
    expect('palette' in unknown && unknown.palette).toEqual('palette' in church && church.palette)
  })
})
