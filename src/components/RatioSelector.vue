<script setup lang="ts">
/**
 * RatioSelector — horizontal scrollable chip group of preset aspect ratios
 *                 plus a "Custom" chip that expands into a two-input editor.
 *
 * The selected chip writes through to editorStore.ratioId.
 *
 * Custom-mode UX:
 *   - Tapping the Custom chip selects it AND opens the editor panel.
 *   - The panel hosts two integer inputs (width, height) + a swap button.
 *   - Inputs default to the current image's intrinsic ratio (gcd-reduced)
 *     so e.g. a 4032×3024 photo lands on 4:3 and the user just hits swap
 *     or fine-tunes from there.
 *   - Bounds: 1 ≤ each side ≤ 10000. Out-of-range values revert on blur.
 *   - Each commit calls `editor.setCustomRatio(w, h)` which atomically
 *     switches ratioId → 'custom' so the EditorCanvas re-renders live.
 */

import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '@/stores/editorStore'
import {
  CUSTOM_RATIO_MAX,
  CUSTOM_RATIO_MIN,
  RATIO_PRESETS,
  reduceRatio,
  type RatioPresetId,
} from '@/config/ratios'
import M3Chip from './ui/M3Chip.vue'
import M3IconButton from './ui/M3IconButton.vue'

const { t } = useI18n()
const editor = useEditorStore()

const isCustom = computed(() => editor.ratioId === 'custom')

// ── Default values for the custom inputs ─────────────────────────────
//
// Priority:
//   1. Whatever the store already has in customRatio (preserved across mode
//      toggles, so leaving + returning to Custom keeps the user's numbers).
//   2. The source image's intrinsic ratio, reduced via gcd.
//   3. 1:1 (square) — when no image is loaded yet.
function intrinsicRatio(): readonly [number, number] {
  if (editor.source) return reduceRatio(editor.source.width, editor.source.height)
  return [1, 1]
}

const initial = editor.customRatio ?? intrinsicRatio()
const customW = ref<number>(initial[0])
const customH = ref<number>(initial[1])

/** When a fresh image arrives AND the user is NOT actively editing custom values,
 *  re-seed the inputs from the new image's intrinsic ratio. */
watch(
  () => editor.source,
  (src) => {
    if (!src) return
    if (editor.customRatio) return // user-set value takes precedence
    const [w, h] = reduceRatio(src.width, src.height)
    customW.value = w
    customH.value = h
  },
)

/** Keep the inputs in sync if the store's customRatio is mutated elsewhere
 *  (e.g. swap button, future "save preset" actions, reset). */
watch(
  () => editor.customRatio,
  (next) => {
    if (!next) return
    if (next[0] !== customW.value) customW.value = next[0]
    if (next[1] !== customH.value) customH.value = next[1]
  },
)

function selectPreset(id: RatioPresetId) {
  editor.setRatioPreset(id)
}

function selectCustom() {
  // Commit the current input values atomically.
  const [w, h] = sanitizePair(customW.value, customH.value)
  customW.value = w
  customH.value = h
  editor.setCustomRatio(w, h)
}

function commitCustom() {
  if (!isCustom.value) return
  const [w, h] = sanitizePair(customW.value, customH.value)
  customW.value = w
  customH.value = h
  editor.setCustomRatio(w, h)
}

function sanitizePair(w: number, h: number): [number, number] {
  return [clampInt(w), clampInt(h)]
}

function clampInt(v: number): number {
  if (!Number.isFinite(v)) return CUSTOM_RATIO_MIN
  return Math.min(CUSTOM_RATIO_MAX, Math.max(CUSTOM_RATIO_MIN, Math.round(v)))
}

function swap() {
  const w = customH.value
  const h = customW.value
  customW.value = w
  customH.value = h
  if (isCustom.value) editor.setCustomRatio(clampInt(w), clampInt(h))
}

function onInputBlur() {
  // On blur, normalise (round + clamp) and re-commit so the displayed value
  // matches what the renderer received.
  commitCustom()
}

function onInputChange() {
  // Live-commit while typing — but only if the user is already in custom mode
  // (avoid yanking them out of a preset just because they touched the input).
  if (isCustom.value) commitCustom()
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
        @click="selectPreset(preset.id)"
      >
        <span class="font-mono tabular-nums opacity-60"
          >{{ preset.ratio[0] }}:{{ preset.ratio[1] }}</span
        >
        <span>{{ t(preset.labelKey) }}</span>
      </M3Chip>

      <!-- Custom chip — opens the inline editor when selected. -->
      <M3Chip :selected="isCustom" :aria-label="t('ratio.custom')" @click="selectCustom">
        <span aria-hidden="true">⚙︎</span>
        <span>{{ t('ratio.custom') }}</span>
      </M3Chip>
    </div>

    <!-- Inline custom-ratio editor. Appears below the chip row only when
         Custom is the active selection, so the form doesn't eat space the
         rest of the time. -->
    <div
      v-if="isCustom"
      class="flex flex-wrap items-end gap-3 rounded-md-lg border border-outline-variant bg-surface-container-low p-3"
    >
      <label class="flex flex-col gap-1 text-xs text-on-surface-variant">
        <span>{{ t('ratio.custom_width') }}</span>
        <input
          v-model.number="customW"
          type="number"
          inputmode="numeric"
          :min="CUSTOM_RATIO_MIN"
          :max="CUSTOM_RATIO_MAX"
          step="1"
          class="w-24 rounded-md-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-sm text-on-surface tabular-nums focus:border-primary focus:outline-none"
          :aria-label="t('ratio.custom_width')"
          @input="onInputChange"
          @blur="onInputBlur"
        />
      </label>

      <span class="pb-2 text-lg font-medium text-on-surface-variant" aria-hidden="true">:</span>

      <label class="flex flex-col gap-1 text-xs text-on-surface-variant">
        <span>{{ t('ratio.custom_height') }}</span>
        <input
          v-model.number="customH"
          type="number"
          inputmode="numeric"
          :min="CUSTOM_RATIO_MIN"
          :max="CUSTOM_RATIO_MAX"
          step="1"
          class="w-24 rounded-md-sm border border-outline-variant bg-surface px-3 py-2 font-mono text-sm text-on-surface tabular-nums focus:border-primary focus:outline-none"
          :aria-label="t('ratio.custom_height')"
          @input="onInputChange"
          @blur="onInputBlur"
        />
      </label>

      <M3IconButton
        variant="tonal"
        size="sm"
        :ariaLabel="t('ratio.swap')"
        class="mb-0.5"
        @click="swap"
      >
        ⇄
      </M3IconButton>
    </div>
  </section>
</template>
