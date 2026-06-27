import { describe, expect, it } from 'vitest'
import { getExportPx } from '@/render/exportSize'
import { IOS_CANVAS_MAX_AREA } from '@/config/constants'

describe('getExportPx', () => {
  it('uses source long edge as target long edge for square output', () => {
    expect(getExportPx({ width: 3000, height: 2000 }, [1, 1])).toEqual({ w: 3000, h: 3000 })
  })

  it('shrinks to fit iOS canvas-area cap when ideal exceeds it', () => {
    // 6000×6000 = 36M px² → way over 16.78M cap. Must scale down proportionally.
    const r = getExportPx({ width: 6000, height: 6000 }, [1, 1])
    expect(r.w).toBe(r.h)
    expect(r.w * r.h).toBeLessThanOrEqual(IOS_CANVAS_MAX_AREA)
    // Should be close to 4096 (sqrt of cap)
    expect(r.w).toBe(4096)
  })

  it('passes when ideal output is exactly at the cap', () => {
    // 4096² = 16,777,216 (exactly the cap)
    const r = getExportPx({ width: 4096, height: 4096 }, [1, 1])
    expect(r).toEqual({ w: 4096, h: 4096 })
  })

  it('respects custom area cap (used to verify scaling math)', () => {
    // With a cap of 1,000,000 (1000²) and a 2000×2000 ideal,
    // k = sqrt(1e6 / 4e6) = 0.5 → 1000×1000
    const r = getExportPx({ width: 2000, height: 2000 }, [1, 1], 1_000_000)
    expect(r).toEqual({ w: 1000, h: 1000 })
  })

  it('handles portrait 9:16 output from landscape source', () => {
    // Source long edge = 3000 → target h = 3000, w = 3000*9/16 = 1687.5
    const r = getExportPx({ width: 3000, height: 2000 }, [9, 16])
    expect(r.h).toBe(3000)
    expect(r.w).toBe(1688) // rounded
  })

  it('handles landscape 16:9 output from portrait source', () => {
    const r = getExportPx({ width: 2000, height: 3000 }, [16, 9])
    expect(r.w).toBe(3000)
    expect(r.h).toBe(Math.round((3000 * 9) / 16))
  })

  it('never returns zero dimensions even for absurd ratios', () => {
    const r = getExportPx({ width: 10, height: 10 }, [1, 100])
    expect(r.w).toBeGreaterThan(0)
    expect(r.h).toBeGreaterThan(0)
  })
})
