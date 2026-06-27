import { describe, expect, it } from 'vitest'
import { intensityToRadiusPx } from '@/render/stackBlur'

describe('intensityToRadiusPx', () => {
  it('returns 0 for intensity 0', () => {
    expect(intensityToRadiusPx(0, 1024)).toBe(0)
  })

  it('scales linearly with intensity', () => {
    const r50 = intensityToRadiusPx(50, 1000)
    const r100 = intensityToRadiusPx(100, 1000)
    expect(r100).toBeCloseTo(r50 * 2)
  })

  it('scales linearly with canvas size — the WYSIWYG guarantee (SPEC I3)', () => {
    // The whole reason this function exists: same intensity, same VISUAL
    // result on any canvas size. Radius must be proportional to short edge.
    const previewRadius = intensityToRadiusPx(60, 1024)
    const exportRadius = intensityToRadiusPx(60, 4096)
    // 4× canvas → 4× radius
    expect(exportRadius / previewRadius).toBeCloseTo(4, 6)
  })

  it('clamps intensity to 0–100', () => {
    expect(intensityToRadiusPx(-10, 1000)).toBe(0)
    expect(intensityToRadiusPx(200, 1000)).toBe(intensityToRadiusPx(100, 1000))
  })

  it('matches the documented formula: intensity/100 × shortEdge × 0.06', () => {
    expect(intensityToRadiusPx(60, 1000)).toBeCloseTo((60 / 100) * 1000 * 0.06)
  })
})
