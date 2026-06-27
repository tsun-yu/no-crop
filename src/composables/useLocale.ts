/**
 * Locale composable — thin wrapper around vue-i18n + persistence.
 *
 * Supports lazy-loading additional locales (zh-TW is lazy by default;
 * see src/i18n/index.ts).
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { loadLocale, type AppLocale, AVAILABLE_LOCALES } from '@/i18n'
import { STORAGE_KEYS } from '@/config/constants'

export function useLocale() {
  const { locale } = useI18n()

  const current = computed<AppLocale>({
    get: () => locale.value as AppLocale,
    set: (value) => {
      void setLocale(value)
    },
  })

  async function setLocale(next: AppLocale): Promise<void> {
    await loadLocale(next)
    locale.value = next
    document.documentElement.lang = next
    try {
      localStorage.setItem(STORAGE_KEYS.locale, next)
    } catch {
      /* localStorage may be disabled */
    }
  }

  return {
    locale: current,
    available: AVAILABLE_LOCALES,
    setLocale,
  }
}
