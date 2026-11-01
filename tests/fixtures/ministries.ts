// Ministerios de prueba con logos SINTÉTICOS (no son logos reales): logotipo horizontal e isotipo
// circular, en negro y blanco. Sirven para probar grupos de 2–3 logos y la forma isotipo.
import { PRELOADED_MINISTRIES } from '../../src/data/ministries'
import type { LogoVariant, Ministry } from '../../src/data/models'

const svg = (body: string, w: number, h: number) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`

const badge = (initials: string, ink: string) =>
  `<circle cx="100" cy="100" r="92" fill="none" stroke="${ink}" stroke-width="12"/><text x="100" y="124" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="72" fill="${ink}">${initials}</text>`

function logos(initials: string, name: string): LogoVariant[] {
  return (['negro', 'blanco'] as const).flatMap((color) => {
    const ink = color === 'negro' ? '#12100b' : '#ffffff'
    return [
      { source: { kind: 'asset', src: svg(badge(initials, ink), 200, 200) }, color, orientation: 'cuadrado' },
      {
        source: {
          kind: 'asset',
          src: svg(`<g transform="scale(0.8)">${badge(initials, ink)}</g><text x="190" y="102" font-family="sans-serif" font-weight="700" font-size="44" fill="${ink}">${name}</text>`, 640, 160),
        },
        color,
        orientation: 'horizontal',
      },
    ] satisfies LogoVariant[]
  })
}

const ministry = (id: string, initials: string, name: string): Ministry => ({
  id,
  updatedAt: '2026-11-01T00:00:00.000Z',
  name,
  isChurch: false,
  logos: logos(initials, name),
})

export const TEST_MINISTRIES: readonly Ministry[] = [
  ...PRELOADED_MINISTRIES,
  ministry('jovenes', 'MJ', 'Jóvenes'),
  ministry('mujer', 'MM', 'Mujer'),
]
