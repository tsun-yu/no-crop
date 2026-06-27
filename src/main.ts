import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { i18n, loadLocale, type AppLocale } from '@/i18n'
import { detectLocale } from '@/i18n/detect'
import { STORAGE_KEYS } from '@/config/constants'

// Styles — tokens MUST be loaded before tailwind so @theme can reference them
import '@/styles/tokens.css'
import '@/styles/tailwind.css'
import '@/styles/base.css'

async function bootstrap() {
  // Resolve initial locale: stored preference → device language → 'en'
  let initialLocale: AppLocale = 'en'
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.locale) as AppLocale | null
    if (stored === 'en' || stored === 'zh-TW') {
      initialLocale = stored
    } else {
      initialLocale = detectLocale(navigator.languages ?? [navigator.language])
    }
  } catch {
    initialLocale = detectLocale(navigator.languages ?? [navigator.language])
  }

  // Lazy-load non-default locale before app mount to avoid flash
  if (initialLocale !== 'en') {
    await loadLocale(initialLocale)
  }
  i18n.global.locale.value = initialLocale
  document.documentElement.lang = initialLocale

  const app = createApp(App)
  app.use(createPinia())
  app.use(i18n)
  app.mount('#app')
}

void bootstrap()
