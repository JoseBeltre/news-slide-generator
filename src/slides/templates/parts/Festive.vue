<script setup lang="ts">
// Adornos de cumpleaños (§9, pedido del responsable): globos, gorrito, pastel, confeti y banderines,
// en colores de fiesta variados (rojo, azul, amarillo, verde y el del tipo), un poco apagados hacia el
// fondo para que no distraigan del nombre. El confeti de esquina sale de los bordes, fuera del área
// segura, así nunca toca un texto. Todo determinista.
import { computed } from 'vue'
import type { Rect } from '../../engine'
import { mixColors, type SlidePalette } from '../../themes'
import { festiveColors } from './festive'

type Corner = 'tl' | 'tr' | 'bl' | 'br'

const props = withDefaults(
  defineProps<{
    kind: 'globos' | 'gorro' | 'pastel' | 'confeti' | 'banderines'
    palette: SlidePalette
    /** Caja del adorno; el confeti de esquina no la usa. */
    box?: Rect
    /** Confeti: esquinas del lienzo de donde sale. */
    corners?: readonly Corner[]
    rotate?: number
    /** Variante de colores (rota la paleta) para que dos adornos iguales no se vean idénticos. */
    variant?: number
  }>(),
  { box: () => ({ x: 0, y: 0, width: 1920, height: 1080 }), corners: () => [], rotate: 0, variant: 0 },
)

const colors = computed(() => festiveColors(props.palette, props.variant))
const c = (i: number) => colors.value[i % colors.value.length]!
const line = computed(() => mixColors(props.palette.text, props.palette.background[0]!, 0.5))

// Globos en una caja de 100 × 160: centro, radio y color.
const BALLOONS = [
  { cx: 30, cy: 42, r: 23, color: 0 },
  { cx: 68, cy: 30, r: 26, color: 1 },
  { cx: 50, cy: 70, r: 21, color: 2 },
]
const TIE = { x: 50, y: 152 }

// Confeti de esquina: [dx, dy, forma, giro, color] desde la esquina hacia dentro; forma 0 = tira,
// 1 = punto, 2 = rombo, 3 = rizo. Las del borde superior e inferior no pasan de ~70 px hacia dentro y las
// que entran más lo hacen pegadas al borde lateral: nunca alcanzan un texto.
const CORNER_PIECES: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [8, 14, 0, 35, 0], [46, -6, 1, 0, 1], [78, 30, 2, 20, 2], [24, 58, 3, -30, 3], [120, 8, 0, -55, 4],
  [-8, 92, 1, 0, 2], [62, 70, 0, 70, 1], [160, 40, 1, 0, 3], [104, 62, 2, 0, 0], [210, 10, 3, 15, 2],
  [14, 140, 0, -20, 4], [-6, 190, 2, 0, 1], [260, 30, 0, 30, 3], [40, 240, 1, 0, 0], [180, -2, 2, 0, 4],
]
const confetti = computed(() =>
  props.corners.flatMap((corner, ci) =>
    CORNER_PIECES.map(([dx, dy, shape, turn, color], i) => {
      const right = corner === 'tr' || corner === 'br'
      const bottom = corner === 'bl' || corner === 'br'
      return {
        key: `${corner}-${i}`,
        x: right ? 1920 - dx : dx,
        y: bottom ? 1080 - dy : dy,
        shape,
        turn: right !== bottom ? -turn : turn,
        fill: c(color + ci),
      }
    }),
  ),
)

// Banderines: cuerda caída con triángulos de colores alternos.
const flags = computed(() => {
  const { x, y, width } = props.box
  const n = Math.max(4, Math.round(width / 120))
  const sag = 30
  const at = (t: number) => ({ x: x + t * width, y: y + 4 * sag * t * (1 - t) })
  return {
    rope: `M${x} ${y}Q${x + width / 2} ${y + sag * 2} ${x + width} ${y}`,
    items: Array.from({ length: n }, (_, i) => {
      const a = at((i + 0.12) / n)
      const b = at((i + 0.88) / n)
      const mid = at((i + 0.5) / n)
      return { points: `${a.x},${a.y} ${b.x},${b.y} ${mid.x},${mid.y + 58}`, fill: c(i) }
    }),
  }
})
const scale = computed(() => (w: number, h: number) => `translate(${props.box.x} ${props.box.y}) scale(${props.box.width / w} ${props.box.height / h})`)
</script>

<template>
  <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0; pointer-events: none; overflow: hidden">
    <g v-if="kind === 'globos'" :transform="scale(100, 160)">
      <path
        v-for="(b, i) in BALLOONS"
        :key="`cuerda-${i}`"
        :d="`M${b.cx} ${b.cy + b.r + 3}Q${(b.cx + TIE.x) / 2 + (i - 1) * 6} ${(b.cy + TIE.y) / 2} ${TIE.x} ${TIE.y}`"
        fill="none"
        :stroke="line"
        stroke-width="0.6"
      />
      <g v-for="(b, i) in BALLOONS" :key="`globo-${i}`">
        <ellipse :cx="b.cx" :cy="b.cy" :rx="b.r * 0.86" :ry="b.r" :fill="c(b.color)" />
        <polygon :points="`${b.cx - 2.6},${b.cy + b.r + 3} ${b.cx + 2.6},${b.cy + b.r + 3} ${b.cx},${b.cy + b.r - 0.5}`" :fill="c(b.color)" />
        <ellipse :cx="b.cx - b.r * 0.32" :cy="b.cy - b.r * 0.38" :rx="b.r * 0.14" :ry="b.r * 0.24" fill="#ffffff" opacity="0.35" />
      </g>
    </g>

    <g v-else-if="kind === 'gorro'" :transform="`${scale(100, 130)} rotate(${rotate} 50 124)`">
      <defs>
        <clipPath :id="`gorro-${box.x}-${box.y}`">
          <polygon points="50,14 92,124 8,124" />
        </clipPath>
      </defs>
      <polygon points="50,14 92,124 8,124" :fill="c(1)" />
      <g :clip-path="`url(#gorro-${box.x}-${box.y})`">
        <path v-for="k in 4" :key="k" :d="`M0 ${30 + k * 26}L100 ${4 + k * 26}`" :stroke="c(2)" stroke-width="9" />
        <circle v-for="k in 3" :key="`p${k}`" :cx="28 + k * 12" :cy="40 + k * 22" r="3.5" :fill="c(0)" />
      </g>
      <circle cx="50" cy="11" r="11" :fill="c(0)" />
      <rect x="4" y="119" width="92" height="10" rx="5" :fill="c(3)" />
    </g>

    <g v-else-if="kind === 'pastel'" :transform="scale(100, 110)">
      <!-- Velas con su llama. -->
      <g v-for="(x, i) in [36, 50, 64]" :key="`vela-${i}`">
        <rect :x="x - 2.5" y="14" width="5" height="22" rx="1.5" :fill="c(i + 1)" />
        <path :d="`M${x} 4C${x + 4} 9 ${x + 3} 13 ${x} 14C${x - 3} 13 ${x - 4} 9 ${x} 4Z`" :fill="c(2)" />
      </g>
      <rect x="24" y="36" width="52" height="24" rx="4" :fill="c(4)" />
      <path d="M24 42Q30 50 36 42T48 42T60 42T72 42T76 42V40H24Z" fill="#ffffff" opacity="0.55" />
      <rect x="12" y="60" width="76" height="32" rx="5" :fill="c(0)" />
      <path d="M12 68Q19 77 26 68T40 68T54 68T68 68T82 68T88 68V66H12Z" fill="#ffffff" opacity="0.55" />
      <circle v-for="(x, i) in [24, 40, 56, 72]" :key="`grag-${i}`" :cx="x" cy="82" r="2.6" :fill="c(i + 1)" />
      <rect x="2" y="92" width="96" height="7" rx="3.5" :fill="line" opacity="0.6" />
    </g>

    <g v-else-if="kind === 'confeti'">
      <g v-for="p in confetti" :key="p.key" :transform="`translate(${p.x} ${p.y}) rotate(${p.turn})`">
        <rect v-if="p.shape === 0" x="-32" y="-9" width="64" height="18" rx="8" :fill="p.fill" />
        <circle v-else-if="p.shape === 1" r="15" :fill="p.fill" />
        <polygon v-else-if="p.shape === 2" points="0,-22 17,0 0,22 -17,0" :fill="p.fill" />
        <path v-else d="M-28 0q7-14 14 0t14 0 14 0 14 0" fill="none" :stroke="p.fill" stroke-width="9" stroke-linecap="round" />
      </g>
    </g>

    <g v-else>
      <path :d="flags.rope" fill="none" :stroke="line" stroke-width="2" />
      <polygon v-for="(f, i) in flags.items" :key="i" :points="f.points" :fill="f.fill" />
    </g>
  </svg>
</template>
