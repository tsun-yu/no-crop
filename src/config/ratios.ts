/**
 * Aspect ratio presets.
 *
 * `ratio` is always expressed as [w, h] integer tuple to avoid float drift.
 * `labelKey` is an i18n key — see locales/{en,zh-TW}.json.
 */

export type RatioPreset = {
  readonly id: string
  readonly ratio: readonly [number, number]
  readonly labelKey: string
}

export const RATIO_PRESETS = [
  { id: 'square', ratio: [1, 1], labelKey: 'ratio.preset.square' },
  { id: 'portrait_4_5', ratio: [4, 5], labelKey: 'ratio.preset.portrait_4_5' },
  { id: 'story_9_16', ratio: [9, 16], labelKey: 'ratio.preset.story_9_16' },
  { id: 'landscape_16_9', ratio: [16, 9], labelKey: 'ratio.preset.landscape_16_9' },
  { id: 'linkcard_191_1', ratio: [191, 100], labelKey: 'ratio.preset.linkcard_191_1' },
  { id: 'tall_3_4', ratio: [3, 4], labelKey: 'ratio.preset.tall_3_4' },
  { id: 'pin_2_3', ratio: [2, 3], labelKey: 'ratio.preset.pin_2_3' },
] as const satisfies readonly RatioPreset[]

export type RatioPresetId = (typeof RATIO_PRESETS)[number]['id']

export const DEFAULT_RATIO_ID: RatioPresetId = 'square'

/** Hard limits for the custom ratio inputs. */
export const CUSTOM_RATIO_MIN = 1
export const CUSTOM_RATIO_MAX = 10_000

/**
 * Reduce a w:h pair to lowest integer terms via Euclid's gcd.
 *
 * Used to display an image's intrinsic ratio neatly — e.g. 1920×1080 → 16:9.
 * Returns `[1, 1]` if either input is non-positive (defensive fallback).
 */
export function reduceRatio(w: number, h: number): readonly [number, number] {
  const wi = Math.max(0, Math.round(w))
  const hi = Math.max(0, Math.round(h))
  if (wi <= 0 || hi <= 0) return [1, 1]
  const g = gcd(wi, hi)
  return [wi / g, hi / g]
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const t = b
    b = a % b
    a = t
  }
  return a || 1
}
