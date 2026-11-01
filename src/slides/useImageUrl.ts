// imageId → object URL del Blob guardado; se libera al cambiar de imagen o al desmontar.
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export function useImageUrl(
  imageId: Ref<string | undefined>,
  loadImage: (imageId: string) => Promise<Blob | undefined>,
): Ref<string | undefined> {
  const url = ref<string>()
  let run = 0
  const release = () => {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = undefined
  }
  watch(
    imageId,
    async (id) => {
      const current = ++run
      release()
      if (!id) return
      const blob = await loadImage(id)
      if (current !== run || !blob) return
      url.value = URL.createObjectURL(blob)
    },
    { immediate: true },
  )
  onBeforeUnmount(() => {
    run++
    release()
  })
  return url
}
