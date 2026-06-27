/**
 * vue-i18n setup.
 *
 * - Only `en` is eagerly bundled. `zh-TW` is loaded on demand via
 *   `loadLocale()` to keep initial bundle small (and to set up the
 *   pattern early for future language additions).
 * - All type-checking of translation keys is wired through
 *   src/i18n/schema.d.ts via module augmentation of vue-i18n.
 */

import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'

export const AVAILABLE_LOCALES = ['en', 'zh-TW'] as const
export type AppLocale = (typeof AVAILABLE_LOCALES)[number]
export const FALLBACK_LOCALE = 'en' as const satisfies AppLocale
type LazyLocale = Exclude<AppLocale, typeof FALLBACK_LOCALE>

/**
 * Widen the messages map so TypeScript knows both locales exist; the zh-TW
 * entry is filled in lazily by loadLocale() before it's ever displayed.
 * The runtime stub is `en` content (will be overwritten on first switch).
 */
const messages: Record<AppLocale, typeof en> = {
  en,
  'zh-TW': en,
}

export const i18n = createI18n({
  legacy: false,
  locale: FALLBACK_LOCALE,
  fallbackLocale: FALLBACK_LOCALE,
  messages,
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
})

/** Locales that have been replaced from their initial stub with real content. */
const loadedLocales = new Set<AppLocale>([FALLBACK_LOCALE])

/**
 * Explicit map of dynamic locale loaders.
 *
 * We use a static map (rather than a templated dynamic import) so that:
 *   - Vite can statically analyze each locale into its own chunk
 *   - The pattern doesn't match the statically-bundled `en.json`
 *     (which would trigger a "dynamically and statically imported" warning)
 */
const dynamicLoaders: Record<
  LazyLocale,
  () => Promise<{
    default: typeof en
  }>
> = {
  'zh-TW': () => import('@/locales/zh-TW.json'),
}

/**
 * Lazy-load and register an additional locale.
 * No-op if already loaded or if the locale is the eagerly-bundled fallback.
 */
export async function loadLocale(locale: AppLocale): Promise<void> {
  if (loadedLocales.has(locale)) return
  if (locale === FALLBACK_LOCALE) return
  // After the FALLBACK_LOCALE narrow above, `locale` is necessarily a LazyLocale.
  const loader = dynamicLoaders[locale]
  const msgs = await loader()
  i18n.global.setLocaleMessage(locale, msgs.default)
  loadedLocales.add(locale)
}
