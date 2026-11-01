<script setup lang="ts">
// Texto ajustado a su slot (§5.6). Mide con la fuente real, informa el resultado y nunca
// se dibuja por debajo del mínimo del rol: si no cabe, se queda en el mínimo y recortado.
import { computed, ref, watch } from 'vue'
import { DEFAULT_FONT_FAMILY } from '../fonts-family'
import { ensureFontLoaded, measureTextFit, normalizeSlotText } from './measure'
import { LINE_HEIGHT, TEXT_ROLES } from './readability'
import type { FitReport, FitResult, TextSlotDef } from './types'

const props = withDefaults(defineProps<{ slot: TextSlotDef; text: string; fontFamily?: string }>(), {
  fontFamily: DEFAULT_FONT_FAMILY,
})
const emit = defineEmits<{ fit: [report: FitReport] }>()

const result = ref<FitResult | null>(null)
let run = 0

watch(
  () => [props.text, props.slot, props.fontFamily] as const,
  async ([text, slot, fontFamily]) => {
    const current = ++run
    try {
      await ensureFontLoaded(fontFamily, [TEXT_ROLES[slot.role].weight])
    } catch (error) {
      // Sin la fuente real no se mide ni se dibuja nada (nunca con métricas de respaldo).
      if (current === run) result.value = null
      console.error(error)
      return
    }
    if (current !== run) return // llegó un cambio más nuevo mientras cargaba la fuente
    const measured = measureTextFit(text, slot, { fontFamily })
    result.value = measured
    emit('fit', { slotId: slot.id, fieldKey: slot.fieldKey, result: measured })
  },
  { immediate: true, deep: true },
)

const fontSize = computed(() => {
  const r = result.value
  if (r?.status === 'fits') return r.fontSize
  if (r?.status === 'too_long') return r.minFontSize
  return null
})

const style = computed(() => {
  const { box, role, align, uppercase } = props.slot
  return {
    position: 'absolute' as const,
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    margin: 0,
    overflow: 'hidden',
    whiteSpace: 'pre-line' as const,
    overflowWrap: 'normal' as const,
    wordBreak: 'normal' as const,
    fontFamily: `"${props.fontFamily}", sans-serif`,
    fontSize: `${fontSize.value}px`,
    fontWeight: TEXT_ROLES[role].weight,
    fontStyle: 'normal',
    lineHeight: LINE_HEIGHT,
    textAlign: align ?? 'left',
    textTransform: uppercase ? ('uppercase' as const) : ('none' as const),
  }
})
</script>

<template>
  <div
    v-if="result && result.status !== 'empty'"
    :style="style"
    :data-role="slot.role"
    :data-slot-id="slot.id"
    :data-field-key="slot.fieldKey"
    :data-fit="result.status"
  >{{ normalizeSlotText(text) }}</div>
</template>
