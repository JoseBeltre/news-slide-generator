<script setup lang="ts">
// Valores con que nacen anuncios y presentaciones (RF-110): estilo, tema, fecha, hora y moneda.
// Solo afectan a lo nuevo y a lo que no eligió un valor propio.
import { toIsoDate } from '../../lib/format'
import { PRESET_THEMES } from '../../slides/themes'
import UiChoiceGroup from '../../ui/UiChoiceGroup.vue'
import DateFormatPicker from '../announcements/shared/DateFormatPicker.vue'
import OptionGroup from '../announcements/shared/OptionGroup.vue'
import StylePicker from '../announcements/shared/StylePicker.vue'
import SettingsSection from './SettingsSection.vue'
import { useSettings } from './useSettings'

const { settings, save } = useSettings()
const today = toIsoDate(new Date())
const THEMES = PRESET_THEMES.map((t) => ({ value: t.id, label: t.name, swatch: t.background }))
const TIME = [
  { value: '12h', label: '12 horas' },
  { value: '24h', label: '24 horas' },
]
const CURRENCY = [
  { value: 'DOP', label: 'RD$' },
  { value: 'USD', label: 'US$' },
]
</script>

<template>
  <SettingsSection id="slides" title="Presentaciones y slides">
    <div class="flex max-w-3xl flex-col gap-6">
      <OptionGroup title="Estilo">
        <StylePicker :model-value="settings.slideStyle" :default-style="settings.slideStyle" label="Estilo de slide" @update:model-value="(v) => v && save({ slideStyle: v })" />
      </OptionGroup>
      <OptionGroup title="Tema">
        <UiChoiceGroup :model-value="settings.defaultThemeId" :options="THEMES" label="Tema de color" @update:model-value="save({ defaultThemeId: $event })" />
      </OptionGroup>
      <DateFormatPicker
        :date-style="settings.dateStyle"
        :relative-dates="settings.relativeDates"
        :sample-date="today"
        :today="today"
        :defaults="settings"
        @update:date-style="(v) => v && save({ dateStyle: v })"
        @update:relative-dates="(v) => v !== undefined && save({ relativeDates: v })"
      />
      <OptionGroup title="Hora">
        <UiChoiceGroup :model-value="settings.timeFormat" :options="TIME" label="Formato de la hora" @update:model-value="save({ timeFormat: $event as '12h' | '24h' })" />
      </OptionGroup>
      <OptionGroup title="Moneda">
        <UiChoiceGroup :model-value="settings.currency" :options="CURRENCY" label="Moneda" @update:model-value="save({ currency: $event })" />
      </OptionGroup>
    </div>
  </SettingsSection>
</template>
