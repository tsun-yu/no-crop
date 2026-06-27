/**
 * Three-state color scheme manager: 'auto' | 'light' | 'dark'.
 *
 * - `mode` is the user's preference (persisted to localStorage)
 * - `effective` is the resolved scheme actually applied to the DOM
 * - Toggles `.dark` class on <html> and reacts to OS-level changes when mode = 'auto'
 *
 * The FOUC blocking script in index.html sets the initial class before any
 * stylesheet loads, so first paint is already correct.
 */

import { computed } from 'vue'
import { useColorMode, usePreferredDark } from '@vueuse/core'
import { STORAGE_KEYS } from '@/config/constants'

export type ColorSchemeMode = 'auto' | 'light' | 'dark'

export function useColorScheme() {
  const mode = useColorMode<ColorSchemeMode>({
    attribute: 'class',
    selector: 'html',
    modes: { light: '', dark: 'dark', auto: '' },
    storageKey: STORAGE_KEYS.colorScheme,
    emitAuto: true,
    initialValue: 'auto',
  })

  const systemDark = usePreferredDark()

  const effective = computed<'light' | 'dark'>(() =>
    mode.value === 'auto' ? (systemDark.value ? 'dark' : 'light') : mode.value,
  )

  return { mode, systemDark, effective }
}
