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
import Icon from './ui/Icon.vue'

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
    class="group relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-md-xl border-2 border-dashed p-10 text-center transition-all duration-300 ease-md-emphasized sm:p-14"
    :class="
      dragging
        ? 'scale-[1.01] border-primary bg-primary-container/50 shadow-md-elev-3'
        : 'border-outline-variant bg-surface-container hover:border-outline hover:bg-surface-container-high'
    "
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Decorative background glyphs (very subtle) -->
    <div class="pointer-events-none absolute -top-12 -right-12 opacity-10" aria-hidden="true">
      <Icon name="image" :size="160" class="text-primary" />
    </div>
    <div class="pointer-events-none absolute -bottom-10 -left-10 opacity-10" aria-hidden="true">
      <Icon name="sparkle" :size="120" class="text-tertiary" />
    </div>

    <!-- Hero icon: a tinted disc with a frame glyph -->
    <div
      class="relative grid h-20 w-20 place-items-center rounded-md-full bg-primary-container text-primary transition-transform duration-500 ease-md-emphasized"
      :class="dragging ? 'scale-110' : 'group-hover:scale-105'"
      aria-hidden="true"
    >
      <Icon name="image" :size="40" />
      <span
        class="absolute -right-1 -bottom-1 grid h-7 w-7 place-items-center rounded-md-full bg-tertiary-container text-on-tertiary-container shadow-md-elev-1"
      >
        <Icon name="plus" :size="18" />
      </span>
    </div>

    <div class="relative flex flex-col items-center gap-1">
      <h2 class="font-brand text-xl font-medium text-on-surface sm:text-2xl">
        {{ t('upload.dropzone.title') }}
      </h2>
      <p class="text-sm text-on-surface-variant">
        {{ t('upload.dropzone.hint') }}
      </p>
    </div>

    <div class="relative mt-1 flex flex-wrap items-center justify-center gap-3">
      <M3Button variant="filled" :disabled="loading" @click="openPicker">
        <Icon name="image" :size="18" />
        {{ t('upload.button.choose') }}
      </M3Button>
      <M3Button variant="tonal" :disabled="loading" @click="pasteFromClipboard">
        <Icon name="paste" :size="18" />
        {{ t('action.paste') }}
      </M3Button>
    </div>

    <!-- Supported formats hint -->
    <p class="relative font-mono text-[11px] tracking-wider text-on-surface-variant/70 uppercase">
      JPEG · PNG · WebP · HEIC
    </p>

    <p v-if="loading" class="text-sm text-on-surface-variant" aria-live="polite">…</p>
    <p
      v-if="errorMessage"
      class="relative rounded-md-md bg-error-container px-3 py-2 text-sm text-on-error-container"
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
