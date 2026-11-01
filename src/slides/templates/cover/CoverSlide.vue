<script setup lang="ts">
// Portada (§9): logo de la iglesia grande, título y fecha de la presentación.
import { computed } from 'vue'
import { formatEventDate } from '../../../lib/format'
import type { TextSlotDef } from '../../engine'
import { referenceDate, type SlideContext, type SlideSpec } from '../contract'
import LogoSlot from '../parts/LogoSlot.vue'
import SlideBackground from '../parts/SlideBackground.vue'
import SlideText from '../parts/SlideText.vue'

const props = defineProps<{ spec: Extract<SlideSpec, { kind: 'cover' | 'closing' }>; ctx: SlideContext }>()
const palette = computed(() => props.spec.palette)

const LOGO_BOX = { x: 460, y: 112, width: 1000, height: 400 }
const TITLE: TextSlotDef = { id: 'portada-titulo', role: 'title', box: { x: 96, y: 576, width: 1728, height: 240 }, maxLines: 2, align: 'center' }
const DATE: TextSlotDef = { id: 'portada-fecha', role: 'key', box: { x: 96, y: 840, width: 1728, height: 120 }, maxLines: 1, align: 'center' }

const dateText = computed(() => formatEventDate(referenceDate(props.ctx), { reference: referenceDate(props.ctx) }))
</script>

<template>
  <SlideBackground :stops="palette.background" :style="{ color: palette.text }">
    <LogoSlot
      :selection="{ kind: 'iglesia' }"
      :ministries="ctx.ministries"
      :background="palette.background"
      :box="LOGO_BOX"
      cover
      align="center"
      :load-image="ctx.loadImage"
    />
    <SlideText :slot="TITLE" :text="ctx.settings.coverTitle" :font-family="palette.fontFamily" />
    <SlideText :slot="DATE" :text="dateText" :font-family="palette.fontFamily" />
  </SlideBackground>
</template>
