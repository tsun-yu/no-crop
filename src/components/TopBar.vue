<script setup lang="ts">
/**
 * TopBar — branding row + theme switcher + language switcher.
 *
 * Uses M3SegmentedButton for both pickers so they read as a single, on-brand
 * Material 3 control instead of bespoke chips.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useColorScheme, type ColorSchemeMode } from '@/composables/useColorScheme'
import { useLocale } from '@/composables/useLocale'
import M3SegmentedButton from './ui/M3SegmentedButton.vue'

const { t } = useI18n()
const { mode, effective, systemDark } = useColorScheme()
const { locale, available, setLocale } = useLocale()

const themeOptions = computed(() => [
  { value: 'auto' as ColorSchemeMode, label: t('theme.system') },
  { value: 'light' as ColorSchemeMode, label: t('theme.light') },
  { value: 'dark' as ColorSchemeMode, label: t('theme.dark') },
])

const localeOptions = computed(() =>
  available.map((loc) => ({
    value: loc,
    label: loc === 'zh-TW' ? t('locale.zh_tw') : t('locale.en'),
  })),
)

const themeHint = computed(() =>
  mode.value === 'auto'
    ? systemDark.value
      ? t('theme.system_effective_dark')
      : t('theme.system_effective_light')
    : null,
)

function onThemeChange(v: string | number) {
  mode.value = v as ColorSchemeMode
}

function onLocaleChange(v: string | number) {
  void setLocale(v as (typeof available)[number])
}
</script>

<template>
  <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="font-brand text-3xl font-medium tracking-tight text-on-surface sm:text-4xl">
        {{ t('app.name') }}
      </h1>
      <p class="mt-1 text-sm text-on-surface-variant">
        {{ t('app.tagline') }}
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <M3SegmentedButton
        :model-value="locale"
        :options="localeOptions"
        :aria-label="t('locale.label')"
        @update:model-value="onLocaleChange"
      />
      <M3SegmentedButton
        :model-value="mode"
        :options="themeOptions"
        :aria-label="t('theme.label')"
        @update:model-value="onThemeChange"
      />
    </div>
  </header>

  <p v-if="themeHint" class="-mt-2 text-xs text-on-surface-variant" aria-live="polite">
    {{ themeHint }} · {{ effective }}
  </p>
</template>
