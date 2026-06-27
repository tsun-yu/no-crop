/**
 * Render worker — runs renderFrame() off the main thread on OffscreenCanvas.
 *
 * Lifecycle:
 *   - The main thread instantiates this worker once and reuses it.
 *   - Each `request` message carries:
 *       - source: an ImageBitmap (Transferable, zero-copy)
 *       - outputPx, ratio, fill, foregroundScale
 *   - The worker draws to an internal OffscreenCanvas of size outputPx,
 *     then `transferToImageBitmap()` to a Transferable result.
 *   - On response, the main thread `drawImage`s the returned bitmap into
 *     the visible <canvas>.
 *
 * NOTE: source IS NOT transferred (we keep ownership on the main thread so
 *       the same bitmap can back many renders without re-decoding). This
 *       means each request `structuredClone`s the ImageBitmap reference —
 *       cheap, but not zero. If profiling shows it matters, we can switch
 *       to per-image upload + slot caching later.
 */

import type { WorkerRenderRequest, WorkerRenderResult } from '@/types/render'
import { renderFrame } from '@/render/renderFrame'

interface WorkerMessage {
  readonly id: number
  readonly payload: WorkerRenderRequest
}

let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null

function ensureCanvas(w: number, h: number): OffscreenCanvasRenderingContext2D {
  if (!canvas) {
    canvas = new OffscreenCanvas(w, h)
    ctx = canvas.getContext('2d')!
  } else if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
    // Re-acquire context if dimensions changed (some engines drop it)
    ctx = canvas.getContext('2d')!
  }
  if (!ctx) throw new Error('OffscreenCanvas 2D context not available')
  return ctx
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { id, payload } = e.data
  try {
    const { source, fill, foregroundScale, outputPx } = payload
    const context = ensureCanvas(outputPx.w, outputPx.h)
    renderFrame(context, outputPx.w, outputPx.h, {
      source,
      fill,
      foregroundScale,
    })
    const bitmap = canvas!.transferToImageBitmap()
    const result: WorkerRenderResult = { bitmap, outputPx }
    ;(self as unknown as Worker).postMessage({ id, ok: true, result }, [bitmap])
  } catch (err) {
    ;(self as unknown as Worker).postMessage({
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

// Vite worker module marker
export {}
