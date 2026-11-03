<script setup lang="ts">
// Portada (con su título), cierre y su estilo en esta presentación (RF-53, §9). El título se escribe en un estado
// local: la lectura de la base llega tarde y, si se enlazara, borraría letras al teclear rápido.
import { ref } from 'vue'
import type { SlideStyleId } from '../../../slides/styles'
import StylePicker from '../../announcements/shared/StylePicker.vue'
import UiCheckbox from '../../../ui/UiCheckbox.vue'
import UiField from '../../../ui/UiField.vue'
import UiInput from '../../../ui/UiInput.vue'

defineProps<{ defaultTitle: string; defaultStyle: SlideStyleId }>()
const showCover = defineModel<boolean>('showCover', { required: true })
const showClosing = defineModel<boolean>('showClosing', { required: true })
const coverTitle = defineModel<string | undefined>('coverTitle')
const slideStyle = defineModel<SlideStyleId | undefined>('slideStyle')
const title = ref(coverTitle.value)
const setTitle = (value: string | undefined) => ((title.value = value), (coverTitle.value = value))
</script>

<template>
  <section aria-labelledby="portada-titulo" class="flex flex-col gap-2">
    <h2 id="portada-titulo" class="font-meta text-meta uppercase text-ink-muted">Portada y cierre</h2>
    <UiCheckbox v-model="showCover">Portada</UiCheckbox>
    <UiField v-if="showCover" id="titulo-portada" label="Título de la portada">
      <UiInput id="titulo-portada" :model-value="title" :placeholder="defaultTitle" @update:model-value="setTitle" />
    </UiField>
    <UiCheckbox v-model="showClosing">Cierre</UiCheckbox>
    <template v-if="showCover || showClosing">
      <p class="mt-2 text-sm font-medium text-ink">Estilo</p>
      <StylePicker v-model="slideStyle" :default-style="defaultStyle" label="Estilo de la portada y el cierre" />
    </template>
  </section>
</template>
