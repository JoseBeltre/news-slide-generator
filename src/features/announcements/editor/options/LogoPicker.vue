<script setup lang="ts">
// "Logo en la slide" (RF-09, RF-37): la iglesia, ninguno o hasta 3 ministerios; logotipo o isotipo.
import { computed } from 'vue'
import { CHURCH_MINISTRY_ID, MAX_LOGOS } from '../../../../data/ministries'
import type { LogoForm, LogoSelection, Ministry } from '../../../../data/models'
import UiCheckbox from '../../../../ui/UiCheckbox.vue'
import UiCollapse from '../../../../ui/UiCollapse.vue'
import UiChoiceGroup from '../../../../ui/UiChoiceGroup.vue'
import OptionGroup from '../../shared/OptionGroup.vue'

const props = defineProps<{ ministries: readonly Ministry[] }>()
const logo = defineModel<LogoSelection>({ required: true })

type Mode = 'iglesia' | 'ninguno' | 'ministerios'
const hasOthers = computed(() => props.ministries.some((m) => m.id !== CHURCH_MINISTRY_ID))
const modes = computed(() => [
  { value: 'iglesia', label: 'Iglesia' },
  ...(hasOthers.value ? [{ value: 'ministerios', label: 'Ministerios' }] : []),
  { value: 'ninguno', label: 'Ninguno' },
])
const FORMS = [
  { value: 'logotipo', label: 'Logotipo' },
  { value: 'isotipo', label: 'Isotipo' },
]

const mode = computed<Mode>(() => (logo.value.kind === 'ministerio' || logo.value.kind === 'varios' ? 'ministerios' : logo.value.kind))
const form = computed(() => (logo.value.kind === 'ninguno' ? undefined : logo.value.form))
const selectedIds = computed<string[]>(() => {
  const l = logo.value
  return l.kind === 'ministerio' ? [l.ministryId] : l.kind === 'varios' ? [...l.ministryIds] : []
})

/** Selección a partir de los ministerios marcados (1 → 'ministerio', 2–3 → 'varios'). */
function fromIds(ids: string[], f = form.value): LogoSelection {
  if (ids.length === 0) return { kind: 'iglesia', form: f }
  return ids.length === 1 ? { kind: 'ministerio', ministryId: ids[0]!, form: f } : { kind: 'varios', ministryIds: ids, form: f }
}

function setMode(m: string) {
  if (m === 'ninguno') logo.value = { kind: 'ninguno' }
  else if (m === 'iglesia') logo.value = { kind: 'iglesia', form: form.value }
  else logo.value = fromIds([props.ministries.find((x) => x.id !== CHURCH_MINISTRY_ID)!.id])
}

function toggle(id: string, on: boolean) {
  const ids = on ? [...selectedIds.value, id] : selectedIds.value.filter((x) => x !== id)
  logo.value = fromIds(ids)
}

function setForm(f: string) {
  const l = logo.value
  if (l.kind !== 'ninguno') logo.value = { ...l, form: f as LogoForm }
}
</script>

<template>
  <OptionGroup title="Logo en la slide">
    <UiChoiceGroup :model-value="mode" :options="modes" label="Logo en la slide" @update:model-value="setMode" />
    <UiCollapse :open="mode === 'ministerios'">
      <div class="flex flex-col">
      <UiCheckbox
        v-for="m in ministries"
        :key="m.id"
        :model-value="selectedIds.includes(m.id)"
        :disabled="!selectedIds.includes(m.id) && selectedIds.length >= MAX_LOGOS"
        @update:model-value="toggle(m.id, $event)"
      >
        {{ m.name }}
      </UiCheckbox>
      <p class="text-sm text-ink-muted">Hasta {{ MAX_LOGOS }} logos.</p>
      </div>
    </UiCollapse>
    <UiCollapse :open="mode !== 'ninguno'">
      <UiChoiceGroup :model-value="form ?? 'logotipo'" :options="FORMS" label="Forma del logo" @update:model-value="setForm" />
    </UiCollapse>
  </OptionGroup>
</template>
