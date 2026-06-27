/**
 * Test helpers for the render pipeline.
 *
 * JSDOM doesn't implement <canvas>. We supply a minimal in-memory mock that
 * records the calls in order, so we can assert renderFrame's composition
 * sequence (clear → bg → fg) and the exact rect coordinates used.
 *
 * This is NOT a pixel-accurate mock; it's a behaviour mock. Pixel correctness
 * is enforced by visual review / Playwright in later milestones.
 */

import type { AnyCanvasContext2D, RenderSource } from '@/types/render'

export type CanvasCall =
  | { kind: 'clearRect'; x: number; y: number; w: number; h: number }
  | { kind: 'fillRect'; x: number; y: number; w: number; h: number; style: string }
  | { kind: 'drawImage'; dx: number; dy: number; dw: number; dh: number }
  | { kind: 'getImageData'; x: number; y: number; w: number; h: number }
  | { kind: 'putImageData'; x: number; y: number }

export interface MockContext extends AnyCanvasContext2D {
  __calls: CanvasCall[]
}

/** Build a mock 2D context that records its method calls. */
export function makeMockContext(width: number, height: number): MockContext {
  const calls: CanvasCall[] = []
  // Allocate a real Uint8ClampedArray so getImageData/putImageData round-trip
  // works for the StackBlur call inside renderFrame().
  const pixels = new Uint8ClampedArray(width * height * 4)

  const ctx: Partial<AnyCanvasContext2D> & { __calls: CanvasCall[]; fillStyle: string } = {
    __calls: calls,
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
    fillStyle: '#000000',
    clearRect(x: number, y: number, w: number, h: number) {
      calls.push({ kind: 'clearRect', x, y, w, h })
    },
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ kind: 'fillRect', x, y, w, h, style: this.fillStyle as string })
    },
    drawImage(_img: unknown, ...args: number[]) {
      // We only use the 5-arg form (img, dx, dy, dw, dh).
      const [dx, dy, dw, dh] = args
      calls.push({ kind: 'drawImage', dx, dy, dw, dh })
    },
    getImageData(x: number, y: number, w: number, h: number) {
      calls.push({ kind: 'getImageData', x, y, w, h })
      return new ImageData(pixels.slice(), w, h)
    },
    putImageData(_data: ImageData, x: number, y: number) {
      calls.push({ kind: 'putImageData', x, y })
    },
  }

  return ctx as MockContext
}

/** Build a fake RenderSource with the given intrinsic size. */
export function makeMockSource(w: number, h: number): RenderSource {
  // ImageBitmap-like object — only width/height are read by renderFrame()
  // for layout math; drawImage() in the mock context ignores the actual pixels.
  return { width: w, height: h, close() {} } as unknown as RenderSource
}
