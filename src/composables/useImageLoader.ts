/**
 * Image loader composable.
 *
 * Pipeline (one call, fully encapsulated):
 *   File / Blob
 *     ↓ HEIC detect? → lazy-load heic2any → convert to JPEG Blob
 *     ↓ createImageBitmap()
 *     ↓ ensureSafeSize: downscale to ≤ MAX_SOURCE_LONG_EDGE (iOS-safe)
 *     ↓ return ImageBitmap (the canonical app-internal source representation)
 *
 * Failure modes are surfaced through the returned `error` ref (i18n keys).
 * The composable owns no DOM state and can be used by any component.
 */

import { ref } from 'vue'
import { MAX_SOURCE_LONG_EDGE } from '@/config/constants'

const HEIC_EXTENSIONS = /\.(heic|heif)$/i
const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])

function isHeic(file: File | Blob): boolean {
  if (file instanceof File && HEIC_EXTENSIONS.test(file.name)) return true
  return HEIC_MIME_TYPES.has(file.type)
}

/**
 * Downscale an ImageBitmap so its long edge is at most MAX_SOURCE_LONG_EDGE.
 * Returns the original bitmap untouched if it's already small enough.
 */
async function ensureSafeSize(bmp: ImageBitmap): Promise<ImageBitmap> {
  const long = Math.max(bmp.width, bmp.height)
  if (long <= MAX_SOURCE_LONG_EDGE) return bmp
  const k = MAX_SOURCE_LONG_EDGE / long
  const next = await createImageBitmap(bmp, {
    resizeWidth: Math.round(bmp.width * k),
    resizeHeight: Math.round(bmp.height * k),
    resizeQuality: 'high',
  })
  // Free the oversized original.
  try {
    bmp.close()
  } catch {
    /* some browsers may have already revoked it */
  }
  return next
}

async function decode(file: File | Blob): Promise<ImageBitmap> {
  let blob: Blob = file
  if (isHeic(file)) {
    // Lazy import — heic2any pulls in ~500KB of libheif WASM
    const { default: heic2any } = await import('heic2any')
    const converted = (await heic2any({ blob, toType: 'image/jpeg', quality: 0.92 })) as
      | Blob
      | Blob[]
    blob = Array.isArray(converted) ? converted[0] : converted
  }
  const bmp = await createImageBitmap(blob)
  return ensureSafeSize(bmp)
}

export type ImageLoadError =
  | { code: 'unsupported_format' }
  | { code: 'heic_decode_failed' }
  | { code: 'image_too_large' }
  | { code: 'generic'; cause?: unknown }

export function useImageLoader() {
  const loading = ref(false)
  const error = ref<ImageLoadError | null>(null)

  async function load(file: File | Blob): Promise<ImageBitmap | null> {
    loading.value = true
    error.value = null
    try {
      const bmp = await decode(file)
      return bmp
    } catch (e) {
      if (isHeic(file)) {
        error.value = { code: 'heic_decode_failed' }
      } else if (e instanceof DOMException && e.name === 'InvalidStateError') {
        error.value = { code: 'image_too_large' }
      } else {
        error.value = { code: 'generic', cause: e }
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { load, loading, error }
}
