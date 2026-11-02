<script setup lang="ts">
// Imagen: se guarda en el dispositivo (sin duplicar, P2) y el campo guarda su id. "Quitar" solo
// suelta la referencia: otro anuncio puede usar la misma imagen. Flyer < 1280 px → aviso (RF-42).
import { ImagePlus } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { InvalidImageError, getImageBlob, saveImage } from '../../../../../data/local/images'
import { useDb } from '../../../../../data/useDb'
import { useImageUrl } from '../../../../../slides/useImageUrl'
import UiBanner from '../../../../../ui/UiBanner.vue'
import UiButton from '../../../../../ui/UiButton.vue'
import type { ControlProps } from '../controlProps'

const MIN_FLYER_WIDTH = 1280

/** `removeLabel`: nombre accesible de "Quitar" cuando hay varias imágenes (fotos de personas). */
const props = defineProps<ControlProps & { removeLabel?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>()

const db = useDb()
const imageId = computed(() => (typeof props.modelValue === 'string' && props.modelValue ? props.modelValue : undefined))
const url = useImageUrl(imageId, (id) => getImageBlob(db, id))
const isFlyer = computed(() => props.field.key === 'imagen')

const width = ref<number>()
watch(imageId, async (id) => (width.value = id ? (await db.images.get(id))?.width : undefined), { immediate: true })
const lowRes = computed(() => isFlyer.value && width.value !== undefined && width.value < MIN_FLYER_WIDTH)

const busy = ref(false)
const uploadError = ref<string>()

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  busy.value = true
  uploadError.value = undefined
  try {
    const asset = await saveImage(db, file, isFlyer.value ? 'flyer' : 'foto')
    emit('update:modelValue', asset.id)
  } catch (err) {
    uploadError.value = err instanceof InvalidImageError ? err.message : 'No se pudo guardar la imagen. Inténtalo otra vez.'
  } finally {
    busy.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-3">
      <img
        v-if="url"
        :src="url"
        alt=""
        :data-image-preview="field.key"
        class="size-24 rounded-sm border border-hairline bg-muted object-contain"
      />
      <UiButton as="label">
        <ImagePlus :size="18" aria-hidden="true" />{{ busy ? 'Guardando…' : url ? 'Cambiar' : 'Elegir imagen' }}
        <input
          :id="id"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          class="sr-only"
          :data-image-input="field.key"
          :aria-invalid="invalid"
          :aria-describedby="describedBy"
          @change="onFile"
        />
      </UiButton>
      <UiButton
        v-if="url"
        variant="ghost"
        :aria-label="removeLabel ?? `Quitar ${field.label.toLocaleLowerCase('es-DO')}`"
        @click="emit('update:modelValue', undefined)"
      >
        Quitar
      </UiButton>
    </div>
    <UiBanner v-if="lowRes">
      La imagen mide {{ width }} px de ancho y en el proyector puede verse borrosa. Si la tienes más grande
      (1280 px o más), úsala.
    </UiBanner>
    <p v-if="uploadError" role="alert" class="text-sm text-danger">{{ uploadError }}</p>
  </div>
</template>
