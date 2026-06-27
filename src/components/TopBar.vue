<script setup lang="ts">
/**
 * TopBar — branding row + theme switcher + language switcher.
 *
 * Uses M3SegmentedButton for both pickers so they read as a single, on-brand
 * Material 3 control instead of bespoke chips.
 *
 * Now hosts the brand mark (BrandMark SVG) + integrated privacy chip so the
 * header reads as a single composed surface rather than three loose rows.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useColorScheme, type ColorSchemeMode } from '@/composables/useColorScheme'
import { useLocale } from '@/composables/useLocale'
import M3SegmentedButton from './ui/M3SegmentedButton.vue'
import BrandMark from './ui/BrandMark.vue'
import Icon from './ui/Icon.vue'

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
  <header class="flex flex-col gap-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <!-- Brand block: logo + title + tagline -->
      <div class="flex items-center gap-3 sm:items-start">
        <BrandMark :size="44" />
        <div class="flex flex-col">
          <h1
            class="font-brand text-3xl leading-tight font-medium tracking-tight text-on-surface sm:text-4xl"
          >
            {{ t('app.name') }}
          </h1>
          <p class="mt-0.5 text-sm text-on-surface-variant">
            {{ t('app.tagline') }}
          </p>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-2 sm:justify-end">
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
    </div>

    <!-- Status row: privacy chip + theme hint -->
    <div class="flex flex-wrap items-center gap-3 text-xs">
      <span
        class="inline-flex items-center gap-1.5 rounded-md-full border border-outline-variant/50 bg-secondary-container/70 px-3 py-1.5 text-on-secondary-container backdrop-blur-sm sm:text-sm"
      >
        <Icon name="shield" :size="16" />
        <span>{{ t('app.privacy.chip') }}</span>
      </span>
      <span v-if="themeHint" class="text-on-surface-variant/70" aria-live="polite">
        {{ themeHint }} · {{ effective }}
      </span>
    </div>
  </header>
</template>
