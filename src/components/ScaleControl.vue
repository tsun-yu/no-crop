<script setup lang="ts">
/**
 * ScaleControl — foreground scale slider (50%–100%).
 *
 * 100% = image's natural "contain" size inside the frame (touches the
 * matching edge). Smaller values insert a border that's filled by the
 * fill mode (solid or blur), producing a polaroid-style margin.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '@/stores/editorStore'
import M3Slider from './ui/M3Slider.vue'

const { t } = useI18n()
const editor = useEditorStore()

const percent = computed({
  get: () => Math.round(editor.foregroundScale * 100),
  set: (v: number) => editor.setForegroundScale(v / 100),
})
</script>

<template>
  <section aria-labelledby="scale-label" class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <label
        id="scale-label"
        for="scale-slider"
        class="text-xs font-medium uppercase tracking-wider text-on-surface-variant"
      >
        {{ t('scale.label') }}
      </label>
      <span
        class="inline-flex h-7 min-w-14 items-center justify-center rounded-md-full bg-primary-container px-3 font-mono text-sm font-semibold text-on-primary-container tabular-nums"
      >
        {{ percent }}{{ t('scale.unit') }}
      </span>
    </div>
    <M3Slider
      id="scale-slider"
      v-model="percent"
      :min="50"
      :max="100"
      :step="1"
      :aria-label="t('scale.label')"
    />
  </section>
</template>
