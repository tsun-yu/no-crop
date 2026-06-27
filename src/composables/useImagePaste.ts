/**
 * Image paste composable.
 *
 * Two paths because mobile and desktop diverge:
 *
 *   1. Desktop (Cmd/Ctrl-V): a window-level `paste` listener picks up the
 *      ClipboardEvent and pulls the first image item from `clipboardData`.
 *      No special permissions; works on every browser that fires `paste`.
 *
 *   2. iPhone / Android (button tap): the `paste` event does not fire from
 *      a tap, so we expose `pasteFromClipboard()` for explicit invocation
 *      under a user gesture. It uses `navigator.clipboard.read()`, which
 *      requires HTTPS + iOS 15.4+ / recent Android Chromium.
 *
 * Errors are returned as a discriminated union mirroring the i18n keys in
 * `locales/*.json` (`error.clipboard_*`, `error.unsupported_format`).
 */

import { onMounted, onBeforeUnmount, ref } from 'vue'

export type PasteError =
  | { code: 'clipboard_empty' }
  | { code: 'clipboard_denied' }
  | { code: 'unsupported_format' }
  | { code: 'generic'; cause?: unknown }

export interface UseImagePasteOptions {
  /** Set false to temporarily ignore paste events (e.g. while a modal is open). */
  enabled?: () => boolean
  onImage: (file: File | Blob) => void | Promise<void>
  onError?: (err: PasteError) => void
}

function extractFromDataTransfer(items: DataTransferItemList | null): File | null {
  if (!items) return null
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (it.kind === 'file') {
      const f = it.getAsFile()
      if (f && (f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))) {
        return f
      }
    }
  }
  return null
}

export function useImagePaste(options: UseImagePasteOptions) {
  const lastError = ref<PasteError | null>(null)

  function reportError(err: PasteError) {
    lastError.value = err
    options.onError?.(err)
  }

  function onPaste(e: ClipboardEvent) {
    if (options.enabled && !options.enabled()) return
    const file = extractFromDataTransfer(e.clipboardData?.items ?? null)
    if (file) {
      e.preventDefault()
      lastError.value = null
      void options.onImage(file)
    }
  }

  /**
   * Programmatic paste — required for iPhone Safari where the window
   * `paste` event doesn't fire from a button tap. Must be called from a
   * user gesture handler.
   */
  async function pasteFromClipboard(): Promise<void> {
    const clipboard = navigator.clipboard as Clipboard | undefined
    if (!clipboard || typeof clipboard.read !== 'function') {
      reportError({ code: 'unsupported_format' })
      return
    }
    try {
      const items = await clipboard.read()
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith('image/'))
        if (imgType) {
          const blob = await item.getType(imgType)
          lastError.value = null
          await options.onImage(blob)
          return
        }
      }
      reportError({ code: 'clipboard_empty' })
    } catch (e) {
      const code =
        e instanceof DOMException && e.name === 'NotAllowedError' ? 'clipboard_denied' : 'generic'
      reportError(code === 'clipboard_denied' ? { code } : { code: 'generic', cause: e })
    }
  }

  onMounted(() => window.addEventListener('paste', onPaste))
  onBeforeUnmount(() => window.removeEventListener('paste', onPaste))

  return { pasteFromClipboard, lastError }
}
