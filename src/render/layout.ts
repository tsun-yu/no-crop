/**
 * Layout math for fitting a source rect into a target rect.
 *
 * Two modes:
 *   - contain: scale source to fit entirely inside target (no crop) — foreground
 *   - cover:   scale source to fill entire target (crops overflow) — blurred bg
 *
 * Functions return integer-rounded destination rects suitable for drawImage().
 */

export interface Rect {
  readonly dx: number
  readonly dy: number
  readonly dw: number
  readonly dh: number
}

export interface Size {
  readonly w: number
  readonly h: number
}

/**
 * Compute destination rect for a "contain" fit (no-crop).
 *
 * @param source  Source bitmap intrinsic size.
 * @param target  Target canvas size.
 * @param scale   Foreground scale, 0.5–1.0. 1 = maximum contain size.
 * @returns       Centered, integer-rounded destination rect.
 */
export function fitContain(source: Size, target: Size, scale = 1): Rect {
  const k = Math.min(target.w / source.w, target.h / source.h) * scale
  const dw = Math.round(source.w * k)
  const dh = Math.round(source.h * k)
  const dx = Math.round((target.w - dw) / 2)
  const dy = Math.round((target.h - dh) / 2)
  return { dx, dy, dw, dh }
}

/**
 * Compute destination rect for a "cover" fit (crops to fill target).
 * Used for the blurred background layer so the blur reaches every edge.
 */
export function fitCover(source: Size, target: Size): Rect {
  const k = Math.max(target.w / source.w, target.h / source.h)
  const dw = Math.round(source.w * k)
  const dh = Math.round(source.h * k)
  const dx = Math.round((target.w - dw) / 2)
  const dy = Math.round((target.h - dh) / 2)
  return { dx, dy, dw, dh }
}

/**
 * Compute output canvas size from an aspect ratio and a long-edge cap.
 *
 * Both dimensions are clamped to at least 1 to avoid degenerate canvases
 * for extreme ratios (e.g. 1:100 with a small source).
 *
 * @param ratio    [w, h] integer ratio.
 * @param longEdge Desired long-edge pixel size.
 * @returns        Integer-rounded canvas size.
 */
export function sizeFromRatio(ratio: readonly [number, number], longEdge: number): Size {
  const [rw, rh] = ratio
  if (rw >= rh) {
    return { w: Math.max(1, longEdge), h: Math.max(1, Math.round((longEdge * rh) / rw)) }
  }
  return { h: Math.max(1, longEdge), w: Math.max(1, Math.round((longEdge * rw) / rh)) }
}
