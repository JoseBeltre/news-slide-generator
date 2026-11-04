<script setup lang="ts">
// Entrar (§8.5): correo → código de 6 dígitos, en una pantalla propia, sin el marco de la app y centrada.
// La sesión queda en este equipo; sin ella la app funciona igual y solo no sincroniza. Al entrar vuelve a
// donde estaba (?volver=) y pide guardar los datos (RF-102).
import { ArrowLeft } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSync } from '../../../data/sync/useSync'
import UiButton from '../../../ui/UiButton.vue'
import CodeStep from './CodeStep.vue'
import EmailStep from './EmailStep.vue'

const sync = useSync()
const route = useRoute()
const router = useRouter()
const email = ref<string | null>(null)
const back = computed(() =>
  typeof route.query.volver === 'string' && route.query.volver.startsWith('/') && !route.query.volver.startsWith('//') ? route.query.volver : '/',
)

async function done() {
  await navigator.storage?.persist?.().catch(() => false)
  await router.replace(back.value)
}
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-ink">
    <section class="w-full max-w-sm">
      <p class="font-meta text-meta tracking-widest text-ink-muted uppercase">Mansedumbre II</p>
      <h1 class="pt-2 font-display text-display-sm text-ink">Entrar</h1>
      <p class="pt-2 pb-6 text-ink-muted">Para compartir los anuncios con el resto del equipo. Sin entrar, la app funciona igual en este equipo.</p>
      <div class="rounded-lg border border-hairline bg-surface p-6">
        <template v-if="sync">
          <EmailStep v-if="email === null" :auth="sync.auth" @sent="(e) => (email = e)" />
          <CodeStep v-else :auth="sync.auth" :email="email" @done="done" @back="email = null" />
        </template>
      </div>
      <UiButton variant="ghost" :to="back" class="mt-4 -ml-4"><ArrowLeft :size="16" aria-hidden="true" />Volver a la app</UiButton>
    </section>
  </main>
</template>
