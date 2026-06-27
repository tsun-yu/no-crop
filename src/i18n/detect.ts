/**
 * Map any BCP-47-ish language tag to one of our supported app locales.
 *
 * Decision rule for Chinese:
 *   This app only ships Traditional Chinese ('zh-TW').
 *   Therefore all 'zh' / 'zh-*' tags map to 'zh-TW'. If/when Simplified
 *   Chinese is added later, change the bare 'zh' fallback first.
 */

import type { AppLocale } from './index'

export function detectLocale(prefs: readonly string[]): AppLocale {
  for (const raw of prefs) {
    const tag = raw.toLowerCase()
    // English variants
    if (tag === 'en' || tag.startsWith('en-')) return 'en'
    // Traditional Chinese variants
    if (
      tag === 'zh-tw' ||
      tag === 'zh-hk' ||
      tag === 'zh-mo' ||
      tag === 'zh-hant' ||
      tag.startsWith('zh-hant-')
    ) {
      return 'zh-TW'
    }
    // Bare 'zh' or any other zh variant → zh-TW (current app only has Traditional)
    if (tag === 'zh' || tag.startsWith('zh-')) return 'zh-TW'
  }
  return 'en'
}
