/**
 * Export canvas sizing.
 *
 * Strategy (SPEC §3.5):
 *   1. Target long-edge = source long-edge (we never upscale).
 *   2. Compute (w, h) from the requested aspect ratio.
 *   3. If total area exceeds the iOS Safari cap, scale down uniformly.
 *
 * Returns integer pixel dimensions safe to pass to canvas.width/height.
 */

import { IOS_CANVAS_MAX_AREA } from '@/config/constants'
import { sizeFromRatio, type Size } from './layout'

export interface SourceSize {
  readonly width: number
  readonly height: number
}

/**
 * Compute the export canvas size given a source bitmap and target aspect ratio.
 *
 * @param source  Source bitmap intrinsic dimensions (already iOS-safe downscaled).
 * @param ratio   Output aspect ratio [w, h].
 * @param areaCap iOS canvas-area cap (default: IOS_CANVAS_MAX_AREA). Override in tests.
 */
export function getExportPx(
  source: SourceSize,
  ratio: readonly [number, number],
  areaCap: number = IOS_CANVAS_MAX_AREA,
): Size {
  const sourceLong = Math.max(source.width, source.height)
  const ideal = sizeFromRatio(ratio, sourceLong)

  const area = ideal.w * ideal.h
  if (area <= areaCap) return ideal

  // Scale down uniformly so the area fits under the cap.
  const k = Math.sqrt(areaCap / area)
  return {
    w: Math.max(1, Math.floor(ideal.w * k)),
    h: Math.max(1, Math.floor(ideal.h * k)),
  }
}
