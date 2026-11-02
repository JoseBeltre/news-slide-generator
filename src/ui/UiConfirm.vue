<script setup lang="ts">
// Diálogo de confirmación (uno por app). <dialog> nativo: atrapa el foco y cierra con Esc.
import { nextTick, ref, watch } from 'vue'
import UiButton from './UiButton.vue'
import { answerConfirm, confirmState } from './useConfirm'

const dialog = ref<HTMLDialogElement | null>(null)
let opener: HTMLElement | null = null

watch(
  () => confirmState.request,
  async (request) => {
    const el = dialog.value
    if (!el) return
    if (request && !el.open) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
      el.showModal()
    } else if (!request && el.open) {
      el.close()
      await nextTick()
      opener?.focus()
      opener = null
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="ui-confirm-title"
    class="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-hairline bg-surface p-6 text-ink backdrop:bg-ink/40"
    @cancel.prevent="answerConfirm(false)"
  >
    <template v-if="confirmState.request">
      <h2 id="ui-confirm-title" class="font-display text-heading-sm">{{ confirmState.request.title }}</h2>
      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton autofocus @click="answerConfirm(false)">Cancelar</UiButton>
        <UiButton :variant="confirmState.request.danger ? 'danger' : 'primary'" @click="answerConfirm(true)">
          {{ confirmState.request.confirmLabel }}
        </UiButton>
      </div>
    </template>
  </dialog>
</template>
