<script setup lang="ts">
// Dibuja cualquier SlideSpec en el lienzo de 1920×1080 y emite su estado (§5.6, RF-10).
// Es el mismo componente en la vista previa, las miniaturas y la ventana pública (§8.2).
import { computed, onMounted, provide, reactive, watch, type Component } from 'vue'
import { SlideCanvas, summarizeFit, type FitReport } from '../engine'
import type { SlideContext, SlideSpec, SlideStatus } from './contract'
import CoverSlide from './cover/CoverSlide.vue'
import { FIT_COLLECTOR } from './fitCollector'

const props = defineProps<{ spec: SlideSpec; ctx: SlideContext }>()
const emit = defineEmits<{ status: [status: SlideStatus] }>()

const COMPONENTS: Partial<Record<SlideSpec['kind'], Component>> = {
  cover: CoverSlide,
}

const reports = reactive(new Map<string, FitReport>())
provide(FIT_COLLECTOR, (report) => {
  reports.set(report.slotId, report)
  emitStatus()
})

function statusNow(): SlideStatus {
  const spec = props.spec
  if (spec.kind === 'announcement' && spec.data.density.status === 'no_cabe') {
    return { status: 'no_cabe', offendingFields: [spec.data.density.fieldKey], reason: 'density' }
  }
  const fit = summarizeFit([...reports.values()])
  return fit.status === 'ok'
    ? { status: 'ok', offendingFields: [] }
    : { status: 'no_cabe', offendingFields: fit.offendingFields, reason: 'fit' }
}
const emitStatus = () => emit('status', statusNow())

// Una slide nueva empieza sin informes; la densidad se conoce sin medir nada.
watch(
  () => props.spec,
  () => {
    reports.clear()
    emitStatus()
  },
)
onMounted(emitStatus)

const component = computed(() => COMPONENTS[props.spec.kind])
const fontFamily = computed(() => ('palette' in props.spec ? props.spec.palette.fontFamily : undefined))
</script>

<template>
  <SlideCanvas :font-family="fontFamily">
    <component :is="component" v-if="component" v-bind="spec" :spec="spec" :ctx="ctx" />
  </SlideCanvas>
</template>
