<script setup lang="ts">
// Adornos de cumpleaños (§9, pedido del responsable): globos, gorrito, confeti y banderines. Tonos
// apagados sacados de la paleta, para que la slide respire y nada distraiga del nombre. Deterministas.
import { computed } from 'vue'
import type { Rect } from '../../engine'
import { mixColors, type SlidePalette } from '../../themes'

const props = withDefaults(
  defineProps<{
    kind: 'globos' | 'gorro' | 'confeti' | 'banderines'
    box: Rect
    palette: SlidePalette
    /** Trazo de línea (Himnario dibuja con filete; los otros estilos, en plano). */
    outline?: boolean
    rotate?: number
    /** Variante del confeti (0–2), para que dos manchas no se vean iguales. */
    variant?: number
  }>(),
  { outline: false, rotate: 0, variant: 0 },
)

const ground = computed(() => props.palette.background[0]!)
// Tres tonos: el acento apagado, el acento más apagado y un neutro del color del texto.
const tones = computed(() => [
  mixColors(props.palette.accent, ground.value, 0.3),
  mixColors(props.palette.accent, ground.value, 0.58),
  mixColors(props.palette.text, ground.value, 0.62),
])
const line = computed(() => mixColors(props.palette.text, ground.value, 0.55))

// Globos en coordenadas de una caja de 100 × 160: centro, radio y tono.
const BALLOONS = [
  { cx: 34, cy: 40, r: 22, tone: 1 },
  { cx: 66, cy: 30, r: 25, tone: 0 },
  { cx: 52, cy: 66, r: 20, tone: 2 },
]
const TIE = { x: 50, y: 150 }
// Confeti en coordenadas 0–100: [x, y, forma, giro, tono]; forma 0 = tira, 1 = punto, 2 = rombo.
const CONFETTI: ReadonlyArray<ReadonlyArray<readonly [number, number, number, number, number]>> = [
  [[8, 12, 0, 30, 0], [28, 4, 1, 0, 2], [46, 22, 2, 15, 1], [70, 8, 0, -40, 2], [90, 26, 1, 0, 0], [16, 48, 2, 0, 2], [60, 54, 0, 60, 0], [84, 70, 2, 30, 1], [34, 80, 1, 0, 1], [6, 92, 0, -20, 2], [72, 96, 1, 0, 0], [52, 88, 0, 10, 2]],
  [[12, 6, 1, 0, 1], [36, 18, 0, -30, 0], [62, 4, 2, 0, 2], [88, 14, 0, 45, 1], [22, 40, 0, 70, 2], [76, 36, 1, 0, 0], [48, 52, 2, 20, 1], [8, 72, 1, 0, 0], [92, 60, 0, -15, 2], [30, 94, 2, 0, 0], [64, 82, 0, 35, 1], [84, 96, 1, 0, 2]],
  [[6, 30, 0, -50, 2], [24, 10, 2, 0, 0], [50, 30, 1, 0, 1], [78, 6, 0, 20, 0], [94, 44, 2, 10, 1], [16, 70, 1, 0, 0], [40, 60, 0, 40, 2], [66, 72, 1, 0, 2], [86, 90, 0, -30, 0], [46, 96, 2, 0, 1]],
]
const confetti = computed(() =>
  CONFETTI[props.variant % CONFETTI.length]!.map(([x, y, shape, turn, tone]) => ({
    x: props.box.x + (x / 100) * props.box.width,
    y: props.box.y + (y / 100) * props.box.height,
    shape,
    turn,
    fill: tones.value[tone]!,
  })),
)
// Banderines: una cuerda caída con triángulos alternando tonos.
const flags = computed(() => {
  const { x, y, width } = props.box
  const n = Math.max(4, Math.round(width / 120))
  const sag = 34
  const at = (t: number) => ({ x: x + t * width, y: y + 4 * sag * t * (1 - t) })
  return {
    rope: `M${x} ${y}Q${x + width / 2} ${y + sag * 2} ${x + width} ${y}`,
    items: Array.from({ length: n }, (_, i) => {
      const a = at((i + 0.15) / n)
      const b = at((i + 0.85) / n)
      const mid = at((i + 0.5) / n)
      return { points: `${a.x},${a.y} ${b.x},${b.y} ${mid.x},${mid.y + 56}`, fill: tones.value[i % 2 === 0 ? 0 : 1]! }
    }),
  }
})
</script>

<template>
  <svg aria-hidden="true" width="1920" height="1080" style="position: absolute; inset: 0; pointer-events: none">
    <g v-if="kind === 'globos'" :transform="`translate(${box.x} ${box.y}) scale(${box.width / 100} ${box.height / 160})`">
      <path
        v-for="(b, i) in BALLOONS"
        :key="`cuerda-${i}`"
        :d="`M${b.cx} ${b.cy + b.r + 3}Q${(b.cx + TIE.x) / 2 + (i - 1) * 6} ${(b.cy + TIE.y) / 2} ${TIE.x} ${TIE.y}`"
        fill="none"
        :stroke="line"
        stroke-width="0.6"
      />
      <g v-for="(b, i) in BALLOONS" :key="`globo-${i}`">
        <ellipse :cx="b.cx" :cy="b.cy" :rx="b.r * 0.86" :ry="b.r" :fill="tones[b.tone]" :stroke="outline ? palette.accent : 'none'" :stroke-width="outline ? 0.7 : 0" />
        <polygon :points="`${b.cx - 2.4},${b.cy + b.r + 3} ${b.cx + 2.4},${b.cy + b.r + 3} ${b.cx},${b.cy + b.r - 0.5}`" :fill="tones[b.tone]" />
        <ellipse :cx="b.cx - b.r * 0.32" :cy="b.cy - b.r * 0.38" :rx="b.r * 0.14" :ry="b.r * 0.24" fill="#ffffff" opacity="0.28" />
      </g>
    </g>

    <g v-else-if="kind === 'gorro'" :transform="`translate(${box.x} ${box.y}) rotate(${rotate} ${box.width / 2} ${box.height}) scale(${box.width / 100} ${box.height / 130})`">
      <defs>
        <clipPath :id="`gorro-${box.x}-${box.y}`">
          <polygon points="50,14 92,124 8,124" />
        </clipPath>
      </defs>
      <polygon points="50,14 92,124 8,124" :fill="tones[0]" :stroke="outline ? palette.accent : 'none'" stroke-width="1.2" />
      <g :clip-path="`url(#gorro-${box.x}-${box.y})`">
        <path v-for="k in 4" :key="k" :d="`M0 ${30 + k * 26}L100 ${4 + k * 26}`" :stroke="tones[1]" stroke-width="9" />
      </g>
      <circle cx="50" cy="11" r="10" :fill="tones[2]" />
      <rect x="4" y="120" width="92" height="9" rx="4.5" :fill="tones[2]" />
    </g>

    <g v-else-if="kind === 'confeti'">
      <g v-for="(c, i) in confetti" :key="i" :transform="`translate(${c.x} ${c.y}) rotate(${c.turn})`">
        <rect v-if="c.shape === 0" x="-11" y="-3.5" width="22" height="7" rx="3" :fill="c.fill" />
        <circle v-else-if="c.shape === 1" r="6" :fill="c.fill" />
        <polygon v-else points="0,-8 7,0 0,8 -7,0" :fill="c.fill" />
      </g>
    </g>

    <g v-else>
      <path :d="flags.rope" fill="none" :stroke="line" stroke-width="2" />
      <polygon v-for="(f, i) in flags.items" :key="i" :points="f.points" :fill="f.fill" />
    </g>
  </svg>
</template>
