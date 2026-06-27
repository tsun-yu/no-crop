<script setup lang="ts">
/**
 * FillControls — pick how the area outside the contained image is filled.
 *
 *   Solid → native color picker + extracted swatches (when available)
 *   Blur  → M3Slider 0–100 (mapped to a px radius by intensityToRadiusPx)
 *
 * The control writes the entire FillState atomically so the renderer never
 * sees an inconsistent { mode: 'solid', intensity: ... } combination.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore, type FillState } from '@/stores/editorStore'
import M3SegmentedButton from './ui/M3SegmentedButton.vue'
import M3Slider from './ui/M3Slider.vue'

const { t } = useI18n()
const editor = useEditorStore()

const modeOptions = computed(() => [
  { value: 'solid' as const, label: t('fill.mode.solid') },
  { value: 'blur' as const, label: t('fill.mode.blur') },
])

function setMode(v: string | number) {
  const mode = v as FillState['mode']
  if (mode === editor.fill.mode) return
  if (mode === 'solid') {
    editor.setFill({ mode: 'solid', color: '#1F1A2E' })
  } else {
    editor.setFill({ mode: 'blur', intensity: 60 })
  }
}

const solidColor = computed({
  get: () => (editor.fill.mode === 'solid' ? editor.fill.color : '#1F1A2E'),
  set: (color: string) => {
    if (editor.fill.mode === 'solid') editor.setFill({ mode: 'solid', color })
  },
})

const blurIntensity = computed({
  get: () => (editor.fill.mode === 'blur' ? editor.fill.intensity : 60),
  set: (intensity: number) => {
    if (editor.fill.mode === 'blur') editor.setFill({ mode: 'blur', intensity })
  },
})

function selectSwatch(color: string) {
  editor.setFill({ mode: 'solid', color })
}
</script>

<template>
  <section aria-labelledby="fill-label" class="flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3">
      <h3 id="fill-label" class="text-sm font-medium text-on-surface-variant">
        {{ t('fill.label') }}
      </h3>
      <M3SegmentedButton
        :model-value="editor.fill.mode"
        :options="modeOptions"
        :aria-label="t('fill.label')"
        @update:model-value="setMode"
      />
    </div>

    <!-- Solid color sub-controls -->
    <div v-if="editor.fill.mode === 'solid'" class="flex flex-col gap-3">
      <label class="flex items-center gap-3 text-sm text-on-surface">
        <input
          v-model="solidColor"
          type="color"
          class="h-10 w-14 cursor-pointer rounded-md-md border border-outline-variant bg-transparent"
          :aria-label="t('fill.solid.color_picker')"
        />
        <span class="font-mono text-xs text-on-surface-variant">{{ solidColor }}</span>
      </label>

      <div v-if="editor.extractedColors.length > 0" class="flex flex-col gap-2">
        <span class="text-xs text-on-surface-variant">
          {{ t('fill.solid.from_image') }}
        </span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in editor.extractedColors"
            :key="c"
            type="button"
            class="h-8 w-8 rounded-md-full border border-outline-variant transition-transform duration-200 ease-md-standard hover:scale-110 active:scale-95"
            :style="{ backgroundColor: c }"
            :aria-label="c"
            :aria-pressed="solidColor.toLowerCase() === c.toLowerCase()"
            @click="selectSwatch(c)"
          />
        </div>
      </div>
    </div>

    <!-- Blur sub-control -->
    <div v-else class="flex flex-col gap-2">
      <div class="flex items-center justify-between text-sm">
        <label for="blur-slider" class="text-on-surface-variant">
          {{ t('fill.blur.intensity') }}
        </label>
        <span class="font-mono text-on-surface tabular-nums">{{ blurIntensity }}</span>
      </div>
      <M3Slider
        id="blur-slider"
        v-model="blurIntensity"
        :min="0"
        :max="100"
        :step="1"
        :aria-label="t('fill.blur.intensity')"
      />
    </div>
  </section>
</template>
