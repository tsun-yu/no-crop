/**
 * Image processing safety constants.
 *
 * iOS Safari caps total canvas area at ~16,777,216 px² (= 4096²).
 * Anything larger silently fails. We use 4096 as the long-edge ceiling
 * for both decoded source ImageBitmaps and exported canvases.
 */

/** Max long-edge (in px) for source ImageBitmap after decode. */
export const MAX_SOURCE_LONG_EDGE = 4096

/** Max total canvas area allowed on iOS Safari. */
export const IOS_CANVAS_MAX_AREA = 16_777_216

/** Preview canvas backing-store cap (mobile). */
export const PREVIEW_MAX_MOBILE = 1024

/** Preview canvas backing-store cap (desktop). */
export const PREVIEW_MAX_DESKTOP = 1280

/** Mobile breakpoint (px) — used for preview sizing only. */
export const MOBILE_BREAKPOINT = 768

/** Slider debounce (ms) for re-render. */
export const RENDER_DEBOUNCE_MS = 160

/** localStorage keys (single namespace prefix to avoid collisions). */
export const STORAGE_KEYS = {
  colorScheme: 'nocrop:color-scheme',
  locale: 'nocrop:locale',
  recentColors: 'nocrop:recent-colors',
  defaultFormat: 'nocrop:default-format',
  defaultJpegQuality: 'nocrop:default-jpeg-quality',
} as const
