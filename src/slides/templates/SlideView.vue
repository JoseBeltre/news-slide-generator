<script setup lang="ts">
// Dibuja cualquier SlideSpec en el lienzo de 1920×1080 y emite su estado (§5.6, RF-10).
// Es el mismo componente en la vista previa, las miniaturas y la ventana pública (§8.2).
import { computed, onMounted, provide, watch, type Component } from 'vue'
import { SlideCanvas, summarizeFit, type FitReport } from '../engine'
import type { SlideContext, SlideSpec, SlideStatus } from './contract'
import BirthdayGroup from './birthday/BirthdayGroup.vue'
import BirthdaySingle from './birthday/BirthdaySingle.vue'
import ClassicSlide from './classic/ClassicSlide.vue'
import CoverSlide from './cover/CoverSlide.vue'
import ImageSlide from './image/ImageSlide.vue'
import { FIT_COLLECTOR } from './fitCollector'

const props = defineProps<{ spec: SlideSpec; ctx: SlideContext }>()
const emit = defineEmits<{ status: [status: SlideStatus] }>()

const ANNOUNCEMENT_COMPONENTS: Record<'clasica' | 'visual', Component | undefined> = { clasica: ClassicSlide, visual: ClassicSlide }
const COMPONENTS: Partial<Record<SlideSpec['kind'], Component>> = {
  cover: CoverSlide,
  closing: CoverSlide,
  image: ImageSlide,
  'birthday-single': BirthdaySingle,
  'birthday-group': BirthdayGroup,
}

// Textos montados y su último ajuste. Un texto sin informe está "midiendo" (la fuente carga en asíncrono).
const mounted = new Set<string>()
const reports = new Map<string, FitReport>()
provide(FIT_COLLECTOR, {
  // Un texto nuevo (otro estilo, una persona más) vuelve la slide a "midiendo" hasta que se mida.
  register: (slotId) => {
    mounted.add(slotId)
    emitStatus()
  },
  invalidate: (slotId) => {
    reports.delete(slotId)
    emitStatus()
  },
  report: (report) => {
    if (!mounted.has(report.slotId)) return
    reports.set(report.slotId, report)
    emitStatus()
  },
  forget: (slotId) => {
    mounted.delete(slotId)
    reports.delete(slotId)
    emitStatus()
  },
})

function statusNow(): SlideStatus {
  const spec = props.spec
  if (spec.kind === 'announcement' && spec.data.density.status === 'no_cabe') {
    return { status: 'no_cabe', offendingFields: [spec.data.density.fieldKey], reason: 'density' }
  }
  if ([...mounted].some((id) => !reports.has(id))) return { status: 'midiendo', offendingFields: [] }
  const fit = summarizeFit([...reports.values()])
  return fit.status === 'ok'
    ? { status: 'ok', offendingFields: [] }
    : { status: 'no_cabe', offendingFields: fit.offendingFields, reason: 'fit' }
}
const emitStatus = () => emit('status', statusNow())

// Un spec nuevo no borra los informes: cada texto que cambió se invalida solo, y el que no cambió
// conserva su ajuste (si no cabía, sigue sin caber). La densidad se conoce sin medir nada.
watch(() => props.spec, emitStatus)
onMounted(emitStatus)

const component = computed(() =>
  props.spec.kind === 'announcement' ? ANNOUNCEMENT_COMPONENTS[props.spec.templateId] : COMPONENTS[props.spec.kind],
)
const fontFamily = computed(() => ('palette' in props.spec ? props.spec.palette.fontFamily : undefined))
</script>

<template>
  <SlideCanvas :font-family="fontFamily">
    <component :is="component" v-if="component" :spec="spec" :ctx="ctx" />
  </SlideCanvas>
</template>
