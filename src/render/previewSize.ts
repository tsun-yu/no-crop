/**
 * Preview canvas sizing.
 *
 * Preview is intentionally rendered smaller than export so slider drags
 * stay smooth on mobile. The preview must still be WYSIWYG identical to
 * export — that property is guaranteed by I3 (resolution-independent
 * params) inside renderFrame(), not by matching sizes here.
 */

import { MOBILE_BREAKPOINT, PREVIEW_MAX_DESKTOP, PREVIEW_MAX_MOBILE } from '@/config/constants'

/**
 * Compute preview canvas backing-store size for a given container CSS width and DPR.
 *
 * Caps to PREVIEW_MAX_MOBILE / PREVIEW_MAX_DESKTOP to keep slider drags 60fps.
 *
 * @param containerCssW  Container width in CSS pixels (the wrapping element)
 * @param dpr            window.devicePixelRatio (or 1 in tests)
 * @param viewportW      window.innerWidth (or undefined → assume desktop)
 */
export function getPreviewMaxLongEdge(
  containerCssW: number,
  dpr: number,
  viewportW: number = Number.POSITIVE_INFINITY,
): number {
  const isMobile = viewportW < MOBILE_BREAKPOINT
  const cap = isMobile ? PREVIEW_MAX_MOBILE : PREVIEW_MAX_DESKTOP
  const ideal = Math.ceil(containerCssW * dpr)
  return Math.max(1, Math.min(cap, ideal))
}
