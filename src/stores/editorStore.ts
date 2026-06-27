/**
 * Editor state — the actively-edited image + render parameters.
 *
 * Source ImageBitmap is `markRaw`'d to avoid reactive overhead on the bitmap.
 */

import { defineStore } from 'pinia'
import { markRaw, ref, computed } from 'vue'
import { DEFAULT_RATIO_ID, RATIO_PRESETS, type RatioPresetId } from '@/config/ratios'

export type FillState =
  | { mode: 'solid'; color: string }
  | { mode: 'blur'; intensity: number /* 0-100 */ }

export const useEditorStore = defineStore('editor', () => {
  /** Decoded + iOS-safe ImageBitmap. `null` when no image loaded. */
  const source = ref<ImageBitmap | null>(null)
  const sourceFilename = ref<string | null>(null)

  const ratioId = ref<RatioPresetId | 'custom'>(DEFAULT_RATIO_ID)
  const customRatio = ref<[number, number] | null>(null)

  const fill = ref<FillState>({ mode: 'blur', intensity: 60 })
  const foregroundScale = ref<number>(1.0) // 0.5 - 1.0

  /** Colors extracted from the current source via ColorThief. */
  const extractedColors = ref<string[]>([])

  const ratio = computed<[number, number]>(() => {
    if (ratioId.value === 'custom' && customRatio.value) return customRatio.value
    const preset = RATIO_PRESETS.find((p) => p.id === ratioId.value)
    return preset ? [...preset.ratio] : [1, 1]
  })

  function setSource(bmp: ImageBitmap, filename: string) {
    source.value = markRaw(bmp)
    sourceFilename.value = filename
    // Clear stale palette — extractColors() will refill it asynchronously.
    extractedColors.value = []
  }

  /** Replace the palette extracted from the current image. */
  function setExtractedColors(colors: string[]) {
    extractedColors.value = colors
  }

  function clearSource() {
    if (source.value) {
      try {
        source.value.close()
      } catch {
        /* ignore */
      }
    }
    source.value = null
    sourceFilename.value = null
    extractedColors.value = []
  }

  function setFill(next: FillState) {
    fill.value = next
  }

  function setForegroundScale(scale: number) {
    foregroundScale.value = Math.min(1, Math.max(0.5, scale))
  }

  function setRatioPreset(id: RatioPresetId) {
    ratioId.value = id
    customRatio.value = null
  }

  function setCustomRatio(w: number, h: number) {
    ratioId.value = 'custom'
    customRatio.value = [w, h]
  }

  function reset() {
    fill.value = { mode: 'blur', intensity: 60 }
    foregroundScale.value = 1.0
    ratioId.value = DEFAULT_RATIO_ID
    customRatio.value = null
  }

  return {
    source,
    sourceFilename,
    ratioId,
    customRatio,
    ratio,
    fill,
    foregroundScale,
    extractedColors,
    setSource,
    setExtractedColors,
    clearSource,
    setFill,
    setForegroundScale,
    setRatioPreset,
    setCustomRatio,
    reset,
  }
})
