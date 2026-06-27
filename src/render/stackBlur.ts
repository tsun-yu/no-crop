/**
 * StackBlur wrapper — the single cross-browser blur entry point.
 *
 * Why this file exists (SPEC §3.2 invariant I2):
 *   `CanvasRenderingContext2D.filter = 'blur(...)'` is unsupported in
 *   Safari (desktop + iOS). We MUST NOT rely on it. StackBlur is a fast
 *   Gaussian approximation that works on any 2D canvas context.
 *
 * The stackblur-canvas npm package exposes a small set of named functions.
 * We pick the one that operates on a canvas directly to keep the call
 * symmetric for both HTMLCanvasElement and OffscreenCanvas (the latter
 * is needed by render.worker.ts).
 *
 * The library doesn't ship TypeScript types for the OffscreenCanvas
 * overloads, so we declare them locally.
 */

import type { AnyCanvasContext2D } from '@/types/render'

// stackblur-canvas exports several variants. We use `imageDataRGBA` which
// operates directly on an ImageData buffer — this is the cross-context path
// (works in OffscreenCanvas too where canvas-targeting overloads may not).
//
// Signature: imageDataRGBA(imageData, topX, topY, width, height, radius)
import { imageDataRGBA } from 'stackblur-canvas'

/**
 * Blur the entire canvas in-place.
 *
 * @param ctx     2D context (CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D).
 * @param width   Canvas width in pixels.
 * @param height  Canvas height in pixels.
 * @param radius  Blur radius in pixels. Caller is responsible for scaling
 *                this with canvas size (see SPEC §3.2 I3).
 */
export function blurCanvas(
  ctx: AnyCanvasContext2D,
  width: number,
  height: number,
  radius: number,
): void {
  if (radius <= 0 || width <= 0 || height <= 0) return

  // StackBlur expects integer radius ≥ 1. Clamp.
  const r = Math.max(1, Math.round(radius))

  // Pull pixels, blur, push back.
  // getImageData() works on both 2D contexts.
  const data = ctx.getImageData(0, 0, width, height)
  imageDataRGBA(data, 0, 0, width, height, r)
  ctx.putImageData(data, 0, 0)
}

/**
 * Compute the actual blur radius (in pixels) for a given UI intensity 0–100
 * and canvas short edge.
 *
 * This is the single source of truth that guarantees preview-vs-export
 * visual consistency (SPEC §3.2 I3). Both paths use this same mapping:
 *
 *   radius_px = (intensity / 100) * shortEdge * 0.06
 *
 * The 0.06 factor was tuned so:
 *   - intensity=60 on a 1024px preview ≈ 36px blur (clearly blurred)
 *   - intensity=60 on a 4096px export  ≈ 144px blur (proportionally identical)
 */
export function intensityToRadiusPx(intensity: number, shortEdgePx: number): number {
  const clamped = Math.max(0, Math.min(100, intensity))
  return (clamped / 100) * shortEdgePx * 0.06
}
