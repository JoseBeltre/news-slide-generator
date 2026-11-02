<script setup lang="ts">
// Texto de plantilla: FitText que informa su ajuste a la SlideView (§5.6). Se registra al montarse y
// vuelve a "sin medir" cuando cambian su texto o su caja; al desmontarse deja de contar.
import { onBeforeUnmount, watch } from 'vue'
import { FitText, type TextSlotDef } from '../../engine'
import { useFitCollector } from '../fitCollector'

const props = defineProps<{ slot: TextSlotDef; text: string; fontFamily?: string }>()
const collector = useFitCollector()

collector.register(props.slot.id)
watch(
  () => [props.slot, props.text, props.fontFamily] as const,
  ([slot], [oldSlot]) => {
    if (slot.id !== oldSlot.id) {
      collector.forget(oldSlot.id)
      collector.register(slot.id)
    } else collector.invalidate(slot.id)
  },
)
onBeforeUnmount(() => collector.forget(props.slot.id))
</script>

<template>
  <FitText :slot="slot" :text="text" :font-family="fontFamily" @fit="collector.report" />
</template>
