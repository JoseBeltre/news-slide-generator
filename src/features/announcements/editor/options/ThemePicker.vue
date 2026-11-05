<script setup lang="ts">
// Tema de la slide (RF-31, RF-32): el de la iglesia, uno predefinido o un color propio. Si el color
// propio se ajusta para llegar a 7:1, se avisa.
import { computed } from 'vue'
import { PRESET_THEMES, deriveTheme } from '../../../../slides/themes'
import type { AnnouncementTypeId } from '../../../../slides/types/fields'
import UiBanner from '../../../../ui/UiBanner.vue'
import UiButton from '../../../../ui/UiButton.vue'
import UiChoiceGroup from '../../../../ui/UiChoiceGroup.vue'
import OptionGroup from '../../shared/OptionGroup.vue'

const props = defineProps<{ typeId: AnnouncementTypeId }>()
const themeId = defineModel<string | undefined>('themeId')
const customColor = defineModel<string | undefined>('customColor')

const CHURCH = 'iglesia'
const OPTIONS = [
  { value: CHURCH, label: 'De la iglesia' },
  ...PRESET_THEMES.map((t) => ({ value: t.id, label: t.name, swatch: t.background })),
]

const selected = computed(() => (customColor.value ? undefined : (themeId.value ?? CHURCH)))
const warning = computed(() => (customColor.value ? deriveTheme(customColor.value, props.typeId).warning : undefined))

function choose(id: string) {
  customColor.value = undefined
  themeId.value = id === CHURCH ? undefined : id
}
</script>

<template>
  <OptionGroup title="Tema">
    <UiChoiceGroup :model-value="selected" :options="OPTIONS" label="Tema de la slide" @update:model-value="choose" />
    <div class="flex flex-wrap items-center gap-3">
      <label class="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink">
        <input
          type="color"
          :value="customColor ?? '#0b1f3a'"
          class="size-9 cursor-pointer rounded-sm border border-field-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          @input="customColor = ($event.target as HTMLInputElement).value"
        />
        Color propio
      </label>
      <UiButton v-if="customColor" variant="ghost" @click="customColor = undefined">Quitar color propio</UiButton>
    </div>
    <UiBanner v-if="warning">{{ warning }}</UiBanner>
  </OptionGroup>
</template>
