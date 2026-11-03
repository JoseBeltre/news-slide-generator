<script setup lang="ts">
// Opciones de la slide bajo la vista previa (SRS §6.3): plantilla, estilo, tema, logo y fecha.
import { computed } from 'vue'
import type { NewRecord } from '../../../../data/local/repository'
import type { Announcement } from '../../../../data/models'
import { toIsoDate } from '../../../../lib/format'
import type { SlideContext } from '../../../../slides/templates/contract'
import { templatesFor } from '../../../../slides/templates/registry'
import { hasMainDate, type AnnouncementTypeDef } from '../../../../slides/types/fields'
import UiChoiceGroup from '../../../../ui/UiChoiceGroup.vue'
import DateFormatPicker from './DateFormatPicker.vue'
import LogoPicker from './LogoPicker.vue'
import OptionGroup from './OptionGroup.vue'
import StylePicker from '../../shared/StylePicker.vue'
import ThemePicker from './ThemePicker.vue'

const props = defineProps<{ typeDef: AnnouncementTypeDef; ctx: SlideContext }>()
/** El borrador del editor: cada opción cambia su propio campo. */
const draft = defineModel<NewRecord<Announcement>>({ required: true })

const templates = computed(() => templatesFor(props.typeDef.id).map((t) => ({ value: t.id, label: t.name })))
const hasDate = computed(() => hasMainDate(props.typeDef))
const sampleDate = computed(() => {
  const fecha = draft.value.values.fecha
  return typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : toIsoDate(new Date())
})
</script>

<template>
  <div v-if="typeDef.id !== 'imagen' || templates.length > 1" class="flex flex-col gap-5 rounded-md border border-hairline bg-surface p-4">
    <OptionGroup v-if="templates.length > 1" title="Plantilla">
      <UiChoiceGroup v-model="draft.templateId" :options="templates" label="Plantilla" />
    </OptionGroup>
    <!-- Un flyer se proyecta tal cual (RF-40): no tiene estilo, tema ni logo. -->
    <template v-if="typeDef.id !== 'imagen'">
      <OptionGroup title="Estilo">
        <StylePicker v-model="draft.slideStyle" :default-style="ctx.settings.slideStyle" label="Estilo de la slide" />
      </OptionGroup>
      <ThemePicker v-model:theme-id="draft.themeId" v-model:custom-color="draft.customPrimaryColor" :type-id="typeDef.id" />
      <LogoPicker v-model="draft.logo" :ministries="ctx.ministries" />
    </template>
    <DateFormatPicker
      v-if="hasDate"
      v-model:date-style="draft.dateStyle"
      v-model:relative-dates="draft.relativeDates"
      :sample-date="sampleDate"
      :today="ctx.today"
      :defaults="ctx.settings"
    />
  </div>
</template>
