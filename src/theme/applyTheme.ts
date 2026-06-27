/**
 * Apply a Material 3 theme to the document.
 *
 * Generates BOTH light and dark schemes from a single seed color via MCU,
 * then injects CSS custom properties (`--md-sys-color-*`) into:
 *   :root  → light scheme
 *   .dark  → dark scheme
 *
 * Switching between light / dark only requires toggling the .dark class on <html>.
 * Switching the seed re-runs this function and replaces the injected style.
 */

import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  type Scheme,
} from '@material/material-color-utilities'

const STYLE_ELEMENT_ID = 'md-theme'

/** Camel-case → kebab-case (e.g. `onPrimaryContainer` → `on-primary-container`). */
function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
}

/** Build a CSS declaration block from a Scheme. */
function schemeToCss(scheme: Scheme): string {
  const json = scheme.toJSON() as Record<string, number>
  return Object.entries(json)
    .map(([role, argb]) => `--md-sys-color-${kebab(role)}: ${hexFromArgb(argb)};`)
    .join('\n  ')
}

/** Update the iOS / Android status bar tint to match current surface color. */
function updateThemeColorMeta(lightHex: string, darkHex: string): void {
  const setMeta = (media: string, content: string) => {
    let meta = document.head.querySelector<HTMLMetaElement>(
      `meta[name="theme-color"][media="${media}"]`,
    )
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.media = media
      document.head.appendChild(meta)
    }
    meta.content = content
  }
  setMeta('(prefers-color-scheme: light)', lightHex)
  setMeta('(prefers-color-scheme: dark)', darkHex)
}

/**
 * Inject (or replace) the M3 theme stylesheet for the given seed hex.
 * Idempotent: safe to call multiple times.
 */
export function applyTheme(seedHex: string): void {
  const theme = themeFromSourceColor(argbFromHex(seedHex))
  const { light, dark } = theme.schemes

  const css = `:root {\n  ${schemeToCss(light)}\n}\n.dark {\n  ${schemeToCss(dark)}\n}\n`

  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ELEMENT_ID
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css

  // Sync status-bar tint with surface color for each scheme
  updateThemeColorMeta(hexFromArgb(light.surface), hexFromArgb(dark.surface))
}
