<script setup lang="ts">
/**
 * FillControls — pick how the area outside the contained image is filled.
 *
 *   Solid → styled color trigger + extracted swatches (when available)
 *   Blur  → M3Slider 0–100 (mapped to a px radius by intensityToRadiusPx)
 *
 * The control writes the entire FillState atomically so the renderer never
 * sees an inconsistent { mode: 'solid', intensity: ... } combination.
 *
 * Suggested color:
 *   When the user switches to Solid mode, we seed the color from the FIRST
 *   palette entry extracted from the image (same algorithm Material You
 *   uses — see src/render/extractColors.ts). The user can override at any
 *   time via the picker or by tapping another swatch.
 */

import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore, type FillState } from '@/stores/editorStore'
import M3SegmentedButton from './ui/M3SegmentedButton.vue'
import M3Slider from './ui/M3Slider.vue'
import Icon from './ui/Icon.vue'

const { t } = useI18n()
const editor = useEditorStore()

/** Neutral fallback used when no image is loaded yet. */
const FALLBACK_SOLID = '#1F1A2E'

/** Hidden native color input — clicked programmatically from our styled trigger. */
const nativeColorInput = ref<HTMLInputElement | null>(null)

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

/** Open the (visually-hidden) native picker when the user clicks our trigger. */
function openColorPicker() {
  nativeColorInput.value?.click()
}

/** Case-insensitive hex compare so #FFF and #fff count as the same swatch. */
function isActiveSwatch(c: string): boolean {
  return solidColor.value.toLowerCase() === c.toLowerCase()
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
    <!-- Mode toggle (Solid / Blur). Keep it content-sized so the outer border
         wraps tightly around the buttons. -->
    <M3SegmentedButton
      :model-value="editor.fill.mode"
      :options="modeOptions"
      :aria-label="t('fill.label')"
      class="self-start"
      @update:model-value="setMode"
    />

    <!-- Solid color sub-controls -->
    <div v-if="editor.fill.mode === 'solid'" class="flex flex-col gap-4">
      <!-- Styled color trigger: replaces the bare native input with a
           tactile swatch + hex chip + edit affordance. The native picker
           still drives the value via a visually-hidden input. -->
      <button
        type="button"
        class="group flex items-center gap-3 self-start rounded-md-full border border-outline-variant bg-surface-container-low p-1.5 pr-4 transition-all duration-200 ease-md-standard hover:border-primary/60 hover:shadow-md-elev-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-label="t('fill.solid.color_picker')"
        @click="openColorPicker"
      >
        <span
          class="grid h-9 w-9 place-items-center rounded-full ring-1 ring-outline-variant transition-transform duration-200 ease-md-standard group-hover:scale-105 group-active:scale-95"
          :style="{ backgroundColor: solidColor }"
        >
          <Icon
            name="palette"
            :size="14"
            class="text-white opacity-70 mix-blend-difference transition-opacity group-hover:opacity-100"
          />
        </span>
        <span class="font-mono text-sm tracking-wider text-on-surface uppercase tabular-nums">
          {{ solidColor }}
        </span>
        <input
          ref="nativeColorInput"
          v-model="solidColor"
          type="color"
          class="swatch-input"
          tabindex="-1"
          :aria-hidden="true"
        />
      </button>

      <div v-if="editor.extractedColors.length > 0" class="flex flex-col gap-2">
        <span class="text-xs font-medium tracking-wider text-on-surface-variant uppercase">
          {{ t('fill.solid.from_image') }}
        </span>
        <div class="flex flex-wrap gap-2.5">
          <button
            v-for="c in editor.extractedColors"
            :key="c"
            type="button"
            class="relative grid h-10 w-10 place-items-center rounded-full transition-all duration-200 ease-md-standard hover:scale-110 active:scale-95"
            :class="
              isActiveSwatch(c)
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                : 'ring-1 ring-outline-variant'
            "
            :style="{ backgroundColor: c }"
            :aria-label="c"
            :aria-pressed="isActiveSwatch(c)"
            @click="selectSwatch(c)"
          >
            <Transition
              enter-active-class="transition-all duration-150 ease-md-standard"
              leave-active-class="transition-all duration-100 ease-md-standard"
              enter-from-class="opacity-0 scale-50"
              leave-to-class="opacity-0 scale-50"
            >
              <Icon
                v-if="isActiveSwatch(c)"
                name="check"
                :size="16"
                class="text-white mix-blend-difference drop-shadow"
              />
            </Transition>
          </button>
        </div>
      </div>
    </div>

    <!-- Blur sub-control -->
    <div v-else class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <label
          for="blur-slider"
          class="text-xs font-medium tracking-wider text-on-surface-variant uppercase"
        >
          {{ t('fill.blur.intensity') }}
        </label>
        <span
          class="inline-flex h-7 min-w-12 items-center justify-center rounded-md-full bg-primary-container px-3 font-mono text-sm font-semibold text-on-primary-container tabular-nums"
        >
          {{ blurIntensity }}
        </span>
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
