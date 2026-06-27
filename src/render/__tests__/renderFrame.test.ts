import { describe, expect, it } from 'vitest'
import { renderFrame } from '@/render/renderFrame'
import { makeMockContext, makeMockSource, type CanvasCall } from '@/__tests__/helpers'

/**
 * These tests verify the contract documented in SPEC §3.2 (invariants I1–I7).
 * They use a behaviour mock — they do NOT verify pixel correctness, only that
 * the right draw calls happen in the right order with the right rect math.
 */

function kinds(calls: CanvasCall[]): string[] {
  return calls.map((c) => c.kind)
}

describe('renderFrame', () => {
  describe('invariant I5 — high-quality smoothing', () => {
    it('enables high-quality image smoothing on every call', () => {
      const ctx = makeMockContext(100, 100)
      const source = makeMockSource(200, 100)
      renderFrame(ctx, 100, 100, {
        source,
        fill: { mode: 'solid', color: '#ff0000' },
        foregroundScale: 1,
      })
      expect(ctx.imageSmoothingEnabled).toBe(true)
      expect(ctx.imageSmoothingQuality).toBe('high')
    })
  })

  describe('invariant I6 — composition order: clear → background → foreground', () => {
    it('solid fill: clear → fillRect → drawImage(fg)', () => {
      const ctx = makeMockContext(1000, 1000)
      const source = makeMockSource(2000, 1000)
      renderFrame(ctx, 1000, 1000, {
        source,
        fill: { mode: 'solid', color: '#000000' },
        foregroundScale: 1,
      })
      expect(kinds(ctx.__calls)).toEqual(['clearRect', 'fillRect', 'drawImage'])
    })

    it('blur fill: clear → drawImage(cover) → getImageData → putImageData → drawImage(fg)', () => {
      const ctx = makeMockContext(1000, 1000)
      const source = makeMockSource(2000, 1000)
      renderFrame(ctx, 1000, 1000, {
        source,
        fill: { mode: 'blur', intensity: 60 },
        foregroundScale: 1,
      })
      expect(kinds(ctx.__calls)).toEqual([
        'clearRect',
        'drawImage', // background cover
        'getImageData',
        'putImageData',
        'drawImage', // foreground contain
      ])
    })
  })

  describe('invariant I3 — resolution-independent params produce proportional pixel rects', () => {
    it('foreground rect scales proportionally with output size for the same source', () => {
      const source = makeMockSource(2000, 1000) // 2:1 source
      const small = makeMockContext(500, 500)
      const large = makeMockContext(2000, 2000)
      renderFrame(small, 500, 500, {
        source,
        fill: { mode: 'solid', color: '#fff' },
        foregroundScale: 1,
      })
      renderFrame(large, 2000, 2000, {
        source,
        fill: { mode: 'solid', color: '#fff' },
        foregroundScale: 1,
      })

      const smallFg = small.__calls.find((c) => c.kind === 'drawImage')! as Extract<
        CanvasCall,
        { kind: 'drawImage' }
      >
      const largeFg = large.__calls.find((c) => c.kind === 'drawImage')! as Extract<
        CanvasCall,
        { kind: 'drawImage' }
      >

      // 4× canvas → 4× foreground rect
      expect(largeFg.dw / smallFg.dw).toBeCloseTo(4, 6)
      expect(largeFg.dh / smallFg.dh).toBeCloseTo(4, 6)
    })

    it('foregroundScale=0.5 produces a smaller centered rect than scale=1', () => {
      const source = makeMockSource(1000, 1000)
      const a = makeMockContext(1000, 1000)
      const b = makeMockContext(1000, 1000)
      renderFrame(a, 1000, 1000, {
        source,
        fill: { mode: 'solid', color: '#fff' },
        foregroundScale: 1.0,
      })
      renderFrame(b, 1000, 1000, {
        source,
        fill: { mode: 'solid', color: '#fff' },
        foregroundScale: 0.5,
      })

      const fgA = a.__calls.find((c) => c.kind === 'drawImage')! as Extract<
        CanvasCall,
        { kind: 'drawImage' }
      >
      const fgB = b.__calls.find((c) => c.kind === 'drawImage')! as Extract<
        CanvasCall,
        { kind: 'drawImage' }
      >
      expect(fgB.dw).toBe(fgA.dw / 2)
      expect(fgB.dh).toBe(fgA.dh / 2)
    })
  })

  describe('invariant I6 — no-crop foreground is always centered', () => {
    it('wide source in square frame leaves equal vertical margins', () => {
      const ctx = makeMockContext(1000, 1000)
      const source = makeMockSource(2000, 1000)
      renderFrame(ctx, 1000, 1000, {
        source,
        fill: { mode: 'solid', color: '#fff' },
        foregroundScale: 1,
      })
      const fg = ctx.__calls.find((c) => c.kind === 'drawImage')! as Extract<
        CanvasCall,
        { kind: 'drawImage' }
      >
      // Source 2:1 in 1:1 frame → 1000×500 centered → y=250
      expect(fg.dw).toBe(1000)
      expect(fg.dh).toBe(500)
      expect(fg.dx).toBe(0)
      expect(fg.dy).toBe(250)
    })

    it('tall source in square frame leaves equal horizontal margins', () => {
      const ctx = makeMockContext(1000, 1000)
      const source = makeMockSource(600, 1200)
      renderFrame(ctx, 1000, 1000, {
        source,
        fill: { mode: 'solid', color: '#fff' },
        foregroundScale: 1,
      })
      const fg = ctx.__calls.find((c) => c.kind === 'drawImage')! as Extract<
        CanvasCall,
        { kind: 'drawImage' }
      >
      expect(fg.dw).toBe(500)
      expect(fg.dh).toBe(1000)
      expect(fg.dx).toBe(250)
      expect(fg.dy).toBe(0)
    })
  })

  describe('solid fill uses the provided color', () => {
    it('applies fillStyle before fillRect', () => {
      const ctx = makeMockContext(100, 100)
      const source = makeMockSource(100, 100)
      renderFrame(ctx, 100, 100, {
        source,
        fill: { mode: 'solid', color: '#abcdef' },
        foregroundScale: 1,
      })
      const fillRect = ctx.__calls.find((c) => c.kind === 'fillRect') as Extract<
        CanvasCall,
        { kind: 'fillRect' }
      >
      expect(fillRect.style).toBe('#abcdef')
      expect(fillRect.w).toBe(100)
      expect(fillRect.h).toBe(100)
    })
  })

  describe('edge cases', () => {
    it('does nothing when output is 0×0', () => {
      const ctx = makeMockContext(0, 0)
      const source = makeMockSource(100, 100)
      renderFrame(ctx, 0, 0, {
        source,
        fill: { mode: 'solid', color: '#fff' },
        foregroundScale: 1,
      })
      expect(ctx.__calls).toHaveLength(0)
    })

    it('skips blur work when intensity is 0', () => {
      const ctx = makeMockContext(100, 100)
      const source = makeMockSource(100, 100)
      renderFrame(ctx, 100, 100, {
        source,
        fill: { mode: 'blur', intensity: 0 },
        foregroundScale: 1,
      })
      // Should still cover-draw the bg + foreground, just no blur round-trip.
      expect(ctx.__calls.some((c) => c.kind === 'getImageData')).toBe(false)
      expect(ctx.__calls.some((c) => c.kind === 'putImageData')).toBe(false)
    })
  })
})
