/**
 * extractColors() — pull a small, UI-suitable palette from an image.
 *
 * Pipeline (the same one Material You uses on Android 14+):
 *
 *   ImageBitmap
 *     ↓ draw to OffscreenCanvas at ≤ MAX_DIM (≈112px) for speed
 *     ↓ getImageData → flatten to ARGB integers
 *     ↓ QuantizerCelebi.quantize (Wu seeding + WSMeans K-means) → 128 clusters
 *     ↓ Score.score                                              → UI-ranked
 *     ↓ hexFromArgb on top N
 *
 * Why these two MCU primitives:
 *   - QuantizerCelebi is the same algorithm Google Pixel uses for wallpaper
 *     theming. It produces perceptually-uniform clusters in CAM16 space.
 *   - Score filters out near-greys + colors with insufficient chroma, and
 *     ranks remaining colors by a weighted sum of (popularity, chroma,
 *     hue separation from already-picked colors). If nothing qualifies it
 *     falls back to Google Blue — perfectly fine for our app.
 *
 * Caller responsibility:
 *   - Provide an already-decoded ImageBitmap (we don't decode here).
 *   - Do not call from inside a tight render loop — quantization on 112²
 *     pixels is ~5ms desktop / ~30ms phone. Once per image load is fine.
 */

import { QuantizerCelebi, Score, hexFromArgb } from '@material/material-color-utilities'

const MAX_DIM = 112 // square cap for the downscaled sample
const QUANTIZE_CLUSTERS = 128

export interface ExtractColorsOptions {
  /** How many top swatches to return. Default 5. */
  count?: number
}

/**
 * Extract a UI-ranked palette from the given image.
 *
 * @returns Array of `#RRGGBB` strings, length ≤ `count`. Always at least 1.
 *          Returns `[]` only if the canvas pipeline is unavailable.
 */
export async function extractColors(
  source: ImageBitmap,
  options: ExtractColorsOptions = {},
): Promise<string[]> {
  const count = Math.max(1, Math.min(10, options.count ?? 5))

  const { w, h } = fitInto(source.width, source.height, MAX_DIM)
  const pixels = await samplePixels(source, w, h)
  if (pixels.length === 0) return []

  const populated = QuantizerCelebi.quantize(pixels, QUANTIZE_CLUSTERS)
  const ranked = Score.score(populated, { desired: count, filter: true })
  return ranked.map(hexFromArgb)
}

/** Downscale to a square cap while preserving aspect ratio. */
function fitInto(srcW: number, srcH: number, cap: number): { w: number; h: number } {
  const k = Math.min(cap / srcW, cap / srcH, 1)
  return {
    w: Math.max(1, Math.round(srcW * k)),
    h: Math.max(1, Math.round(srcH * k)),
  }
}

/**
 * Draw the source bitmap into a small canvas and return its pixels packed as
 * ARGB integers (the format QuantizerCelebi expects).
 *
 * Uses OffscreenCanvas when available (worker-friendly + no DOM mutation);
 * falls back to a detached HTMLCanvasElement otherwise.
 */
async function samplePixels(source: ImageBitmap, w: number, h: number): Promise<number[]> {
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null
  if (typeof OffscreenCanvas !== 'undefined') {
    const off = new OffscreenCanvas(w, h)
    ctx = off.getContext('2d', { willReadFrequently: true })
  } else {
    const cnv = document.createElement('canvas')
    cnv.width = w
    cnv.height = h
    ctx = cnv.getContext('2d', { willReadFrequently: true })
  }
  if (!ctx) return []

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'low' // sampling — quality irrelevant
  ctx.drawImage(source, 0, 0, w, h)

  const { data } = ctx.getImageData(0, 0, w, h)
  const out: number[] = []
  // Pack each pixel as 0xAARRGGBB and skip fully transparent ones.
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 255) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // ARGB int; `| 0` keeps it in signed-32 range like MCU expects.
    out.push((255 << 24) | (r << 16) | (g << 8) | b | 0)
  }
  return out
}
