<script setup lang="ts">
/**
 * FillControls — pick how the area outside the contained image is filled.
 *
 *   Solid → native color picker + extracted swatches (when available)
 *   Blur  → M3Slider 0–100 (mapped to a px radius by intensityToRadiusPx)
 *
 * The control writes the entire FillState atomically so the renderer never
 * sees an inconsistent { mode: 'solid', intensity: ... } combination.
 *
 * Suggested color (req #3):
 *   When the user switches to Solid mode, we seed the color from the FIRST
 *   palette entry extracted from the image (same algorithm Material You
 *   uses — see src/render/extractColors.ts). The user can override at any
 *   time via the picker or by tapping another swatch.
 */

import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore, type FillState } from '@/stores/editorStore'
import M3SegmentedButton from './ui/M3SegmentedButton.vue'
import M3Slider from './ui/M3Slider.vue'

const { t } = useI18n()
const editor = useEditorStore()

/** Neutral fallback used when no image is loaded yet. */
const FALLBACK_SOLID = '#1F1A2E'

const modeOptions = computed(() => [
  { value: 'solid' as const, label: t('fill.mode.solid') },
  { value: 'blur' as const, label: t('fill.mode.blur') },
])

/** Best guess for an on-brand solid color given the current image. */
function suggestedSolidColor(): string {
  return editor.extractedColors[0] ?? FALLBACK_SOLID
}

function setMode(v: string | number) {
  const mode = v as FillState['mode']
  if (mode === editor.fill.mode) return
  if (mode === 'solid') {
    editor.setFill({ mode: 'solid', color: suggestedSolidColor() })
  } else {
    editor.setFill({ mode: 'blur', intensity: 60 })
  }
}

const solidColor = computed({
  get: () => (editor.fill.mode === 'solid' ? editor.fill.color : suggestedSolidColor()),
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

/**
 * If the user is already in Solid mode when colors finish extracting (race
 * between image-load → extract vs. the user toggling to Solid first), upgrade
 * the fallback color to the suggested one — but ONLY if they haven't picked
 * a custom value yet.
 */
watch(
  () => editor.extractedColors[0],
  (next) => {
    if (!next) return
    if (editor.fill.mode !== 'solid') return
    if (editor.fill.color !== FALLBACK_SOLID) return
    editor.setFill({ mode: 'solid', color: next })
  },
)
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
