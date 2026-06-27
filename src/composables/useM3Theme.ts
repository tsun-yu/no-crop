/**
 * M3 theme composable.
 *
 * Owns the current seed color and re-applies the theme (CSS vars) when it changes.
 * On the first call, applies the brand seed.
 *
 * `setSeed(hex)` is used by the "Re-theme from image" action.
 */

import { ref, watchEffect } from 'vue'
import { BRAND_SEED } from '@/theme/seed'
import { applyTheme } from '@/theme/applyTheme'

// Module-level singleton — there is only one active theme per document.
const seed = ref<string>(BRAND_SEED)
let initialized = false

export function useM3Theme() {
  if (!initialized) {
    initialized = true
    watchEffect(() => {
      applyTheme(seed.value)
    })
  }

  function setSeed(hex: string) {
    seed.value = hex
  }

  function resetToBrand() {
    seed.value = BRAND_SEED
  }

  return { seed, setSeed, resetToBrand }
}
