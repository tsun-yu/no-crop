import { describe, expect, it } from 'vitest'
import { getPreviewMaxLongEdge } from '@/render/previewSize'
import { PREVIEW_MAX_DESKTOP, PREVIEW_MAX_MOBILE } from '@/config/constants'

describe('getPreviewMaxLongEdge', () => {
  it('caps to PREVIEW_MAX_MOBILE on mobile viewports', () => {
    // 400px container × DPR 3 = 1200 ideal, mobile cap = 1024
    expect(getPreviewMaxLongEdge(400, 3, 375)).toBe(PREVIEW_MAX_MOBILE)
  })

  it('caps to PREVIEW_MAX_DESKTOP on desktop viewports', () => {
    // 800px container × DPR 2 = 1600 ideal, desktop cap = 1280
    expect(getPreviewMaxLongEdge(800, 2, 1440)).toBe(PREVIEW_MAX_DESKTOP)
  })

  it('does not upscale beyond the ideal CSS × DPR value', () => {
    // 200px × DPR 1 = 200 ideal — well under any cap
    expect(getPreviewMaxLongEdge(200, 1, 1440)).toBe(200)
  })

  it('returns at least 1 when container is zero', () => {
    expect(getPreviewMaxLongEdge(0, 2, 1024)).toBe(1)
  })
})
