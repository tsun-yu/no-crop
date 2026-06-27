/**
 * App-wide user preferences (persisted to localStorage by individual composables).
 *
 * This store is the single source of truth for "what defaults should new
 * sessions inherit" — color mode, locale, export defaults, etc.
 *
 * Color mode + locale are owned by their dedicated composables (useColorScheme,
 * useLocale) for reactivity; this store mirrors export-related settings only.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { STORAGE_KEYS } from '@/config/constants'

export type ExportFormat = 'png' | 'jpeg'

function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

function readString<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw && (allowed as readonly string[]).includes(raw)) return raw as T
  } catch {
    /* ignore */
  }
  return fallback
}

function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const defaultFormat = ref<ExportFormat>(
    readString(STORAGE_KEYS.defaultFormat, ['png', 'jpeg'] as const, 'png'),
  )
  const defaultJpegQuality = ref<number>(readNumber(STORAGE_KEYS.defaultJpegQuality, 92))

  function setDefaultFormat(fmt: ExportFormat) {
    defaultFormat.value = fmt
    writeString(STORAGE_KEYS.defaultFormat, fmt)
  }

  function setDefaultJpegQuality(q: number) {
    const clamped = Math.min(100, Math.max(60, Math.round(q)))
    defaultJpegQuality.value = clamped
    writeString(STORAGE_KEYS.defaultJpegQuality, String(clamped))
  }

  return {
    defaultFormat,
    defaultJpegQuality,
    setDefaultFormat,
    setDefaultJpegQuality,
  }
})
