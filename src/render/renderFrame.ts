/**
 * renderFrame() — the single, pure rendering function.
 *
 * SPEC §3 invariants enforced by this module:
 *
 *   I1  Single source of truth: this exact function backs both the live
 *       preview canvas AND the final export canvas. Different `outputPx`
 *       → same logical image, just at a different resolution.
 *
 *   I2  No `ctx.filter`. All blurring goes through stackBlur (cross-browser,
 *       Safari-safe).
 *
 *   I3  Resolution-independent params:
 *         - `foregroundScale` is unit-less (50%–100%).
 *         - Blur `intensity` (0–100) is converted to pixels via
 *           intensityToRadiusPx() against the CURRENT canvas short edge,
 *           which guarantees the preview and export look identical.
 *
 *   I5  Always set imageSmoothingEnabled = true, quality = 'high'.
 *
 *   I6  Fixed composition order: clear → background (solid OR cover+blur)
 *       → foreground (contain × scale).
 *
 *   I7  Pure function. No DOM access, no globals, no I/O. Works identically
 *       on HTMLCanvasElement and OffscreenCanvas (i.e. inside a worker).
 *
 * This file MUST stay free of DOM-only APIs so the worker bundle stays small.
 */

import type { AnyCanvasContext2D, FillParams, RenderSource } from '@/types/render'
import { fitContain, fitCover } from './layout'
import { blurCanvas, intensityToRadiusPx } from './stackBlur'

export interface RenderInput {
  readonly source: RenderSource
  readonly fill: FillParams
  /** Foreground scale 0.5–1.0. Caller is responsible for clamping. */
  readonly foregroundScale: number
}

/**
 * Get intrinsic size of any RenderSource.
 * Works in worker (no DOM) because all four source types expose width/height.
 */
function getSourceSize(src: RenderSource): { w: number; h: number } {
  // ImageBitmap, OffscreenCanvas, HTMLCanvasElement all expose .width/.height
  // HTMLImageElement uses naturalWidth/Height pre-load and width/height post.
  if ('naturalWidth' in src) {
    return { w: src.naturalWidth || src.width, h: src.naturalHeight || src.height }
  }
  return { w: src.width, h: src.height }
}

/**
 * Render one frame to the given 2D context.
 *
 * The context's underlying canvas MUST already be sized to (outputW, outputH).
 * This function does NOT resize the canvas (so it can be called against an
 * OffscreenCanvas inside a worker without losing transferred ownership).
 *
 * @param ctx       2D context (Canvas or OffscreenCanvas).
 * @param outputW   Backing-store width in physical pixels.
 * @param outputH   Backing-store height in physical pixels.
 * @param input     Source bitmap + fill + foreground scale.
 */
export function renderFrame(
  ctx: AnyCanvasContext2D,
  outputW: number,
  outputH: number,
  input: RenderInput,
): void {
  if (outputW <= 0 || outputH <= 0) return

  const { source, fill, foregroundScale } = input
  const srcSize = getSourceSize(source)
  const targetSize = { w: outputW, h: outputH }

  // ── I5: high-quality smoothing on every render call ────────────
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // ── I6: clear ───────────────────────────────────────────────────
  ctx.clearRect(0, 0, outputW, outputH)

  // ── I6: background layer ────────────────────────────────────────
  if (fill.mode === 'solid') {
    ctx.fillStyle = fill.color
    ctx.fillRect(0, 0, outputW, outputH)
  } else {
    // Blur mode — first draw source as cover so the entire canvas is filled,
    // then blur the pixels. The radius scales with this canvas size so the
    // visual result is identical between preview and export (SPEC I3).
    const coverRect = fitCover(srcSize, targetSize)
    ctx.drawImage(
      source as CanvasImageSource,
      coverRect.dx,
      coverRect.dy,
      coverRect.dw,
      coverRect.dh,
    )
    const shortEdge = Math.min(outputW, outputH)
    const radiusPx = intensityToRadiusPx(fill.intensity, shortEdge)
    blurCanvas(ctx, outputW, outputH, radiusPx)
  }

  // ── I6: foreground layer ────────────────────────────────────────
  const fgRect = fitContain(srcSize, targetSize, foregroundScale)
  if (fgRect.dw > 0 && fgRect.dh > 0) {
    ctx.drawImage(source as CanvasImageSource, fgRect.dx, fgRect.dy, fgRect.dw, fgRect.dh)
  }
}
