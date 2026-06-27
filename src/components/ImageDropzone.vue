<script setup lang="ts">
/**
 * ImageDropzone — the empty-state landing surface for choosing an image.
 *
 * Three input methods, one handler:
 *   - Drag & drop a file
 *   - Click "Choose image" → native file picker
 *   - Cmd/Ctrl-V (desktop) OR tap "Paste" button (mobile)
 *
 * All paths funnel through `useImageLoader.load()` → `editorStore.setSource()`.
 *
 * Error states are surfaced inline using the i18n `error.*` keys.
 */

import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImageLoader, type ImageLoadError } from '@/composables/useImageLoader'
import { useImagePaste, type PasteError } from '@/composables/useImagePaste'
import { useEditorStore } from '@/stores/editorStore'
import { extractColors } from '@/render/extractColors'
import M3Button from './ui/M3Button.vue'

const { t } = useI18n()
const editor = useEditorStore()
const { load, loading, error: loadError } = useImageLoader()

const dragDepth = ref(0) // counts nested dragenter/leave to avoid flicker
const dragging = computed(() => dragDepth.value > 0)
const fileInputEl = useTemplateRef<HTMLInputElement>('fileInputEl')
const pasteError = ref<PasteError | null>(null)

const errorMessage = computed<string | null>(() => {
  if (loadError.value) return mapLoadError(loadError.value)
  if (pasteError.value) return mapPasteError(pasteError.value)
  return null
})

function mapLoadError(err: ImageLoadError): string {
  switch (err.code) {
    case 'heic_decode_failed':
      return t('error.heic_decode_failed')
    case 'image_too_large':
      return t('error.image_too_large')
    case 'unsupported_format':
      return t('error.unsupported_format')
    default:
      return t('error.generic')
  }
}

function mapPasteError(err: PasteError): string {
  switch (err.code) {
    case 'clipboard_empty':
      return t('error.clipboard_empty')
    case 'clipboard_denied':
      return t('error.clipboard_denied')
    case 'unsupported_format':
      return t('error.unsupported_format')
    default:
      return t('error.generic')
  }
}

async function handleFile(file: File | Blob) {
  pasteError.value = null
  const bmp = await load(file)
  if (!bmp) return
  const name = file instanceof File ? file.name : 'pasted-image.png'
  editor.setSource(bmp, name)

  // Extract a UI-suitable palette in the background. We intentionally don't
  // await it before showing the editor — the preview can paint first; swatches
  // appear as soon as quantization finishes (~5–30ms).
  void extractColors(bmp, { count: 5 })
    .then((colors) => {
      // Guard against a stale image swap while quantizing.
      if (editor.source === bmp && colors.length > 0) {
        editor.setExtractedColors(colors)
      }
    })
    .catch((err) => {
      console.warn('[ImageDropzone] extractColors failed:', err)
    })
}

const { pasteFromClipboard } = useImagePaste({
  enabled: () => !editor.source,
  onImage: handleFile,
  onError: (err) => (pasteError.value = err),
})

// ── Drag-and-drop ────────────────────────────────────────────────────
function onDragEnter(e: DragEvent) {
  e.preventDefault()
  dragDepth.value++
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDragLeave(e: DragEvent) {
  e.preventDefault()
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragDepth.value = 0
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) {
    void handleFile(file)
  } else {
    pasteError.value = { code: 'unsupported_format' }
  }
}

// ── File picker ──────────────────────────────────────────────────────
function openPicker() {
  fileInputEl.value?.click()
}

function onPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void handleFile(file)
  input.value = '' // allow re-picking the same file
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-4 rounded-md-xl border-2 border-dashed p-10 text-center transition-colors duration-200 ease-md-standard"
    :class="
      dragging
        ? 'border-primary bg-primary-container/40'
        : 'border-outline-variant bg-surface-container'
    "
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div class="text-6xl" aria-hidden="true">🖼️</div>
    <h2 class="text-xl font-medium text-on-surface">
      {{ t('upload.dropzone.title') }}
    </h2>
    <p class="text-sm text-on-surface-variant">
      {{ t('upload.dropzone.hint') }}
    </p>

    <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
      <M3Button variant="filled" :disabled="loading" @click="openPicker">
        {{ t('upload.button.choose') }}
      </M3Button>
      <M3Button variant="tonal" :disabled="loading" @click="pasteFromClipboard">
        {{ t('action.paste') }}
      </M3Button>
    </div>

    <p v-if="loading" class="text-sm text-on-surface-variant" aria-live="polite">…</p>
    <p
      v-if="errorMessage"
      class="rounded-md-md bg-error-container px-3 py-2 text-sm text-on-error-container"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <input
      ref="fileInputEl"
      type="file"
      accept="image/*,.heic,.heif"
      class="hidden"
      @change="onPicked"
    />
  </div>
</template>
