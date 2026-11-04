<script setup lang="ts">
// Entrar (§8.5): correo → código de 6 dígitos. La sesión queda en este equipo; sin ella la app funciona
// igual y solo no sincroniza. Al entrar vuelve a donde estaba (?volver=) y pide guardar los datos (RF-102).
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSync } from '../../../data/sync/useSync'
import UiPageHeader from '../../../ui/UiPageHeader.vue'
import CodeStep from './CodeStep.vue'
import EmailStep from './EmailStep.vue'

const sync = useSync()
const route = useRoute()
const router = useRouter()
const email = ref<string | null>(null)

async function done() {
  await navigator.storage?.persist?.().catch(() => false)
  const back = typeof route.query.volver === 'string' && route.query.volver.startsWith('/') ? route.query.volver : '/'
  await router.replace(back)
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <UiPageHeader title="Entrar" />
    <p class="pb-6 text-ink-muted">Para compartir los anuncios con el resto del equipo. Sin entrar, la app funciona igual en este equipo.</p>
    <template v-if="sync">
      <EmailStep v-if="email === null" :auth="sync.auth" @sent="(e) => (email = e)" />
      <CodeStep v-else :auth="sync.auth" :email="email" @done="done" @back="email = null" />
    </template>
  </section>
</template>
