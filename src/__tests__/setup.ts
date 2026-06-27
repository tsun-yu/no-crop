/**
 * Vitest global setup.
 *
 * JSDOM doesn't ship a real canvas implementation, nor does it polyfill
 * ImageData. We provide a tiny ImageData shim here so render-pipeline tests
 * that round-trip pixel data through StackBlur don't crash.
 *
 * Note: this shim is BEHAVIOURAL (round-trips the buffer); it is not
 * pixel-accurate. Visual correctness is verified separately.
 */

if (typeof globalThis.ImageData === 'undefined') {
  class ImageDataPolyfill {
    readonly data: Uint8ClampedArray
    readonly width: number
    readonly height: number
    readonly colorSpace = 'srgb' as const

    constructor(arg1: Uint8ClampedArray | number, arg2: number, arg3?: number) {
      if (typeof arg1 === 'number') {
        // (sw, sh)
        const sw = arg1
        const sh = arg2
        this.width = sw
        this.height = sh
        this.data = new Uint8ClampedArray(sw * sh * 4)
      } else {
        // (data, sw, [sh])
        this.data = arg1
        this.width = arg2
        this.height = arg3 ?? Math.floor(arg1.length / 4 / arg2)
      }
    }
  }
  // Install on both globalThis and window for JSDOM
  ;(globalThis as Record<string, unknown>).ImageData = ImageDataPolyfill
}

export {}
