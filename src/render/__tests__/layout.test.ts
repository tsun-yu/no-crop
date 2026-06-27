import { describe, expect, it } from 'vitest'
import { fitContain, fitCover, sizeFromRatio } from '@/render/layout'

describe('fitContain', () => {
  it('fits a wide image into a square frame (vertical letterbox)', () => {
    const r = fitContain({ w: 2000, h: 1000 }, { w: 1000, h: 1000 })
    // long edge = 1000, short edge = 500, centered vertically
    expect(r.dw).toBe(1000)
    expect(r.dh).toBe(500)
    expect(r.dx).toBe(0)
    expect(r.dy).toBe(250)
  })

  it('fits a tall image into a square frame (horizontal pillar-box)', () => {
    const r = fitContain({ w: 600, h: 1200 }, { w: 1000, h: 1000 })
    expect(r.dw).toBe(500)
    expect(r.dh).toBe(1000)
    expect(r.dx).toBe(250)
    expect(r.dy).toBe(0)
  })

  it('honors scale=0.5 (foreground shrinks to half max-contain size)', () => {
    const r = fitContain({ w: 1000, h: 500 }, { w: 1000, h: 1000 }, 0.5)
    // max-contain = 1000×500; at 0.5 → 500×250 centered
    expect(r.dw).toBe(500)
    expect(r.dh).toBe(250)
    expect(r.dx).toBe(250)
    expect(r.dy).toBe(375)
  })

  it('preserves aspect ratio for portrait source in landscape frame', () => {
    const r = fitContain({ w: 900, h: 1600 }, { w: 1920, h: 1080 })
    // limited by height: k = 1080/1600 = 0.675 → 607.5 × 1080
    expect(r.dw).toBe(608)
    expect(r.dh).toBe(1080)
    expect(r.dy).toBe(0)
    expect(r.dx).toBe(Math.round((1920 - 608) / 2))
  })
})

describe('fitCover', () => {
  it('expands beyond the frame so the source fills every edge', () => {
    const r = fitCover({ w: 2000, h: 1000 }, { w: 1000, h: 1000 })
    // limited by short side; image must overflow horizontally
    expect(r.dh).toBe(1000)
    expect(r.dw).toBe(2000)
    expect(r.dy).toBe(0)
    expect(r.dx).toBe(-500)
  })

  it('matches the frame exactly when source already has that ratio', () => {
    const r = fitCover({ w: 1080, h: 1920 }, { w: 540, h: 960 })
    expect(r.dw).toBe(540)
    expect(r.dh).toBe(960)
    expect(r.dx).toBe(0)
    expect(r.dy).toBe(0)
  })
})

describe('sizeFromRatio', () => {
  it('square', () => {
    expect(sizeFromRatio([1, 1], 1080)).toEqual({ w: 1080, h: 1080 })
  })

  it('landscape 16:9', () => {
    expect(sizeFromRatio([16, 9], 1920)).toEqual({ w: 1920, h: 1080 })
  })

  it('portrait 9:16 (long edge = height)', () => {
    expect(sizeFromRatio([9, 16], 1920)).toEqual({ w: 1080, h: 1920 })
  })

  it('portrait 4:5', () => {
    expect(sizeFromRatio([4, 5], 1080)).toEqual({ w: 864, h: 1080 })
  })

  it('link card 191:100', () => {
    expect(sizeFromRatio([191, 100], 1910)).toEqual({ w: 1910, h: 1000 })
  })
})
