<script setup lang="ts">
/**
 * RatioSelector — horizontal scrollable chip group of preset aspect ratios.
 *
 * The selected chip writes through to editorStore.ratioId.
 * `custom` is intentionally not exposed in MVP (deferred to v1.1).
 */

import { useI18n } from 'vue-i18n'
import { useEditorStore } from '@/stores/editorStore'
import { RATIO_PRESETS, type RatioPresetId } from '@/config/ratios'
import M3Chip from './ui/M3Chip.vue'

const { t } = useI18n()
const editor = useEditorStore()

function select(id: RatioPresetId) {
  editor.setRatioPreset(id)
}
</script>

<template>
  <section aria-labelledby="ratio-label" class="flex flex-col gap-3">
    <h3 id="ratio-label" class="text-sm font-medium text-on-surface-variant">
      {{ t('ratio.label') }}
    </h3>
    <div
      class="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1 pb-1"
      role="group"
      :aria-label="t('ratio.label')"
    >
      <M3Chip
        v-for="preset in RATIO_PRESETS"
        :key="preset.id"
        :selected="editor.ratioId === preset.id"
        :aria-label="t(preset.labelKey)"
        @click="select(preset.id)"
      >
        <span class="font-mono tabular-nums opacity-60"
          >{{ preset.ratio[0] }}:{{ preset.ratio[1] }}</span
        >
        <span>{{ t(preset.labelKey) }}</span>
      </M3Chip>
    </div>
  </section>
</template>
