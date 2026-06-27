<script setup lang="ts">
/**
 * EditorCanvas — the live preview surface.
 *
 * Responsibilities:
 *   - Display the rendered preview at the current frame ratio
 *   - Compute backing-store size from container width × DPR (capped per SPEC §3.4)
 *   - Re-render on any reactive change in the editor store (debounced for sliders)
 *
 * Non-responsibilities (delegated):
 *   - Image decoding   → useImageLoader
 *   - Pixel composition → renderFrame() via useRenderer
 *   - Export blob       → useRenderer.renderToBlob()
 *
 * The component is intentionally a "dumb" surface — all user input lives in
 * sibling control components writing to the editor store.
 *
 * Initial-paint contract (avoids the "white canvas" race):
 *   The very first render is dispatched IMMEDIATELY (not debounced) once
 *   the container has a real measured width. Subsequent re-renders driven
 *   by slider drags / option toggles go through the standard debounce.
 */

import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useDevicePixelRatio, useElementSize, useWindowSize } from '@vueuse/core'
import { useEditorStore } from '@/stores/editorStore'
import { useRenderer } from '@/composables/useRenderer'
import { RENDER_DEBOUNCE_MS } from '@/config/constants'
import { sizeFromRatio } from '@/render/layout'
import { getPreviewMaxLongEdge } from '@/render/previewSize'

const editor = useEditorStore()
const { renderTo, isRendering, lastError } = useRenderer()

const container = useTemplateRef<HTMLDivElement>('container')
const canvasEl = useTemplateRef<HTMLCanvasElement>('canvasEl')

const { width: containerCssW } = useElementSize(container)
const { pixelRatio } = useDevicePixelRatio()
const { width: viewportW } = useWindowSize()

/**
 * Backing-store size derived from current ratio + container + DPR.
 * `null` when the container hasn't measured yet — caller must skip render.
 */
const previewPx = computed(() => {
  const w = containerCssW.value
  if (!w || w < 8) return null
  const longEdge = getPreviewMaxLongEdge(w, pixelRatio.value || 1, viewportW.value)
  return sizeFromRatio(editor.ratio, longEdge)
})

/** CSS aspect-ratio for the wrapper so layout matches frame shape immediately. */
const cssAspect = computed(() => `${editor.ratio[0]} / ${editor.ratio[1]}`)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
const hasRenderedOnce = ref(false)

function clearDebounce() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

function scheduleRender(immediate = false): void {
  clearDebounce()
  if (immediate) {
    void doRender()
    return
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void doRender()
  }, RENDER_DEBOUNCE_MS)
}

async function doRender(): Promise<void> {
  const canvas = canvasEl.value
  const px = previewPx.value
  if (!canvas || !editor.source || !px) return
  if (px.w <= 0 || px.h <= 0) return
  await renderTo(canvas, {
    source: editor.source,
    fill: editor.fill,
    foregroundScale: editor.foregroundScale,
    outputPx: px,
  })
  hasRenderedOnce.value = true
}

// Reactive triggers — every change schedules a debounced re-render.
// First successful render (once container has measured) is dispatched
// without waiting for the debounce window.
watch(
  () => [
    editor.source,
    editor.fill,
    editor.foregroundScale,
    previewPx.value?.w,
    previewPx.value?.h,
  ],
  () => {
    // If we haven't rendered yet but everything is now ready, paint immediately.
    const immediate = !hasRenderedOnce.value && !!editor.source && !!previewPx.value
    scheduleRender(immediate)
  },
  { deep: true, immediate: true },
)

// If the source is cleared (user picked another image), reset paint state.
watch(
  () => editor.source,
  (src) => {
    if (!src) hasRenderedOnce.value = false
  },
)

onBeforeUnmount(clearDebounce)

const hasImage = computed(() => editor.source !== null)

const errorMessage = computed(() => {
  const e = lastError.value
  if (!e) return null
  return e instanceof Error ? e.message : String(e)
})
</script>

<template>
  <div
    ref="container"
    class="glow-primary relative w-full overflow-hidden rounded-md-xl border border-outline-variant/60 bg-surface-container-low"
    :style="{ aspectRatio: cssAspect }"
  >
    <!-- The actual visible preview canvas -->
    <canvas v-show="hasImage" ref="canvasEl" class="block h-full w-full" aria-label="Preview" />

    <!-- Idle state -->
    <div
      v-if="!hasImage"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-on-surface-variant/80"
    >
      <div class="grid h-14 w-14 place-items-center rounded-md-full bg-secondary-container text-on-secondary-container">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z" />
        </svg>
      </div>
      <span class="text-sm">Preview will appear here</span>
    </div>

    <!-- Rendering indicator -->
    <Transition
      enter-active-class="transition-opacity duration-150 ease-md-standard"
      leave-active-class="transition-opacity duration-200 ease-md-standard"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isRendering && hasImage"
        class="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md-full bg-surface/80 px-2.5 py-1 text-xs font-medium text-on-surface shadow-md-elev-1 backdrop-blur-md"
      >
        <span
          class="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
          aria-hidden="true"
        />
        rendering
      </div>
    </Transition>

    <!-- Error overlay (last error from the renderer) -->
    <div
      v-if="errorMessage && hasImage"
      class="absolute right-2 bottom-2 left-2 rounded-md-md bg-error-container px-3 py-2 text-xs text-on-error-container shadow-md-elev-2"
      role="alert"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>
