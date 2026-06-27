/**
 * useRenderer — main-thread orchestrator that drives renderFrame() either
 * via a Web Worker (OffscreenCanvas-capable browsers) or directly on the
 * main thread (Safari < 16.4 fallback).
 *
 * The composable owns:
 *   - The visible HTMLCanvasElement (passed in by the consumer)
 *   - The worker instance (singleton per useRenderer() call)
 *   - A render-request queue: only the latest request matters; in-flight
 *     ones are awaited but their results are discarded if stale.
 *
 * It DOES NOT own:
 *   - The source ImageBitmap (passed in per request, kept by editorStore)
 *   - Sizing decisions (caller supplies outputPx)
 *
 * WYSIWYG (SPEC §3.2): worker and main-thread paths import the SAME
 * renderFrame() module, so they cannot drift.
 */

import { onBeforeUnmount, ref, shallowRef, toRaw } from 'vue'
import { renderFrame } from '@/render/renderFrame'
import type { FillParams, OutputPx, WorkerRenderRequest, WorkerRenderResult } from '@/types/render'

// Vite worker import. The query suffix is removed by Vite's transform.
import RenderWorker from '@/workers/render.worker?worker'

const canUseOffscreen = typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined'

/**
 * Strip Vue reactivity from `fill` before crossing the worker boundary.
 *
 * `editor.fill` is the unwrapped value of a `ref<FillState>` — i.e. a
 * reactive Proxy. Most browsers structured-clone Vue proxies transparently,
 * but a few engines (notably some WebKit and Electron variants) throw
 * `DataCloneError` because the proxy reports internal-slot properties that
 * are not cloneable. `toRaw()` returns the underlying plain object — safe
 * to postMessage.
 *
 * We also coerce numbers explicitly so a stray reactive ref slipping in
 * can't taint the worker payload.
 */
function sanitizeFill(fill: FillParams): FillParams {
  const raw = toRaw(fill) as FillParams
  if (raw.mode === 'solid') return { mode: 'solid', color: String(raw.color) }
  return { mode: 'blur', intensity: Number(raw.intensity) }
}

interface WorkerEnvelope {
  readonly id: number
  readonly ok: boolean
  readonly result?: WorkerRenderResult
  readonly error?: string
}

export interface RenderRequest {
  readonly source: ImageBitmap
  readonly fill: FillParams
  readonly foregroundScale: number
  readonly outputPx: OutputPx
}

export function useRenderer() {
  const isRendering = ref(false)
  const lastError = shallowRef<unknown>(null)

  let worker: Worker | null = null
  let workerDisabled = false
  let nextId = 0
  let latestId = 0
  const pending = new Map<number, (env: WorkerEnvelope) => void>()

  function ensureWorker(): Worker | null {
    if (!canUseOffscreen) return null
    if (workerDisabled) return null
    if (worker) return worker
    try {
      worker = new RenderWorker()
    } catch (e) {
      console.error('[useRenderer] Failed to instantiate worker, falling back to main thread:', e)
      workerDisabled = true
      return null
    }
    worker.onmessage = (e: MessageEvent<WorkerEnvelope>) => {
      const env = e.data
      const handler = pending.get(env.id)
      if (handler) {
        pending.delete(env.id)
        handler(env)
      }
    }
    worker.onerror = (e) => {
      console.error('[useRenderer] Worker onerror:', e)
      lastError.value = e.error ?? e.message
    }
    worker.onmessageerror = (e) => {
      console.error('[useRenderer] Worker onmessageerror (likely DataCloneError):', e)
    }
    return worker
  }

  /** Main-thread fallback render — used when no worker, or worker errored out. */
  function renderOnMainThread(target: HTMLCanvasElement, req: RenderRequest): void {
    const ctx = target.getContext('2d')
    if (!ctx) throw new Error('Target canvas 2D context unavailable')
    renderFrame(ctx, target.width, target.height, {
      source: req.source,
      fill: req.fill,
      foregroundScale: req.foregroundScale,
    })
  }

  /**
   * Render into the given visible HTMLCanvasElement.
   * Resizes the canvas backing store to req.outputPx if needed.
   *
   * Returns a Promise that resolves when this specific render is on-screen
   * or has been superseded by a newer one.
   */
  async function renderTo(target: HTMLCanvasElement, req: RenderRequest): Promise<void> {
    const id = ++nextId
    latestId = id
    isRendering.value = true
    try {
      // Resize visible canvas if needed
      if (target.width !== req.outputPx.w) target.width = req.outputPx.w
      if (target.height !== req.outputPx.h) target.height = req.outputPx.h

      const w = ensureWorker()
      if (w) {
        // ── Worker path (OffscreenCanvas) ───────────────────────────
        let env: WorkerEnvelope
        try {
          env = await new Promise<WorkerEnvelope>((resolve, reject) => {
            pending.set(id, resolve)
            const payload: WorkerRenderRequest = {
              source: toRaw(req.source) as ImageBitmap,
              ratio: [req.outputPx.w, req.outputPx.h],
              fill: sanitizeFill(req.fill),
              foregroundScale: Number(req.foregroundScale),
              outputPx: { w: req.outputPx.w, h: req.outputPx.h },
            }
            try {
              w.postMessage({ id, payload })
            } catch (postErr) {
              pending.delete(id)
              reject(postErr)
            }
          })
        } catch (postErr) {
          // postMessage failed (DataCloneError etc.) — fall back permanently to main thread
          console.error(
            '[useRenderer] postMessage failed, disabling worker and falling back to main thread:',
            postErr,
          )
          workerDisabled = true
          try {
            worker?.terminate()
          } catch {
            /* ignore */
          }
          worker = null
          if (id !== latestId) return
          renderOnMainThread(target, req)
          return
        }
        if (id !== latestId) return // a newer request superseded this one
        if (!env.ok || !env.result) {
          console.error('[useRenderer] Worker render failed:', env.error)
          // One-shot fallback to main thread for this request
          renderOnMainThread(target, req)
          return
        }
        const ctx = target.getContext('2d', { willReadFrequently: false })
        if (!ctx) throw new Error('Target canvas 2D context unavailable')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.clearRect(0, 0, target.width, target.height)
        ctx.drawImage(env.result.bitmap, 0, 0)
        env.result.bitmap.close()
      } else {
        // ── Main-thread fallback (iOS Safari < 16.4, or worker disabled) ──
        if (id !== latestId) return
        renderOnMainThread(target, req)
      }
    } catch (err) {
      console.error('[useRenderer] renderTo failed:', err)
      lastError.value = err
    } finally {
      if (id === latestId) isRendering.value = false
    }
  }

  /**
   * Render to a one-off OffscreenCanvas (or HTMLCanvasElement fallback) and
   * return the resulting Blob. Used by the Download path; reuses the same
   * pipeline so output matches preview pixel-for-pixel (within format/quality).
   */
  async function renderToBlob(
    req: RenderRequest,
    type: 'image/png' | 'image/jpeg',
    quality?: number,
  ): Promise<Blob> {
    if (typeof OffscreenCanvas !== 'undefined') {
      const off = new OffscreenCanvas(req.outputPx.w, req.outputPx.h)
      const ctx = off.getContext('2d')
      if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable')
      renderFrame(ctx, req.outputPx.w, req.outputPx.h, {
        source: req.source,
        fill: req.fill,
        foregroundScale: req.foregroundScale,
      })
      return off.convertToBlob({ type, quality })
    }
    // Fallback: hidden HTMLCanvasElement
    const cnv = document.createElement('canvas')
    cnv.width = req.outputPx.w
    cnv.height = req.outputPx.h
    const ctx = cnv.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    renderFrame(ctx, cnv.width, cnv.height, {
      source: req.source,
      fill: req.fill,
      foregroundScale: req.foregroundScale,
    })
    return new Promise<Blob>((resolve, reject) => {
      cnv.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))), type, quality)
    })
  }

  onBeforeUnmount(() => {
    worker?.terminate()
    worker = null
    pending.clear()
  })

  return {
    renderTo,
    renderToBlob,
    isRendering,
    lastError,
    canUseOffscreen,
  }
}
