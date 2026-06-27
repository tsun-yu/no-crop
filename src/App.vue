<script setup lang="ts">
/**
 * App.vue — the editor shell.
 *
 * Layout:
 *
 *   TopBar (brand mark + theme + locale + integrated privacy chip)
 *   ──────────────────────────────────
 *   ImageDropzone   ← shown when no image loaded
 *      OR
 *   EditorCanvas    ← live WYSIWYG preview, with brand-tinted glow
 *   M3Card "frame"    → RatioSelector
 *   M3Card "look"     → FillControls + ScaleControl
 *   M3Card "export"   → DownloadBar (visually prominent CTA)
 *
 * Every control panel binds directly to editorStore. The store is the only
 * source of truth feeding renderFrame() — that's what makes preview ≡ export.
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '@/stores/editorStore'
import { useM3Theme } from '@/composables/useM3Theme'
import TopBar from '@/components/TopBar.vue'
import ImageDropzone from '@/components/ImageDropzone.vue'
import EditorCanvas from '@/components/EditorCanvas.vue'
import RatioSelector from '@/components/RatioSelector.vue'
import FillControls from '@/components/FillControls.vue'
import ScaleControl from '@/components/ScaleControl.vue'
import DownloadBar from '@/components/DownloadBar.vue'
import M3Card from '@/components/ui/M3Card.vue'
import Icon from '@/components/ui/Icon.vue'

// Bootstrap the M3 theme (re-applies whenever seed or scheme changes)
useM3Theme()

const { t } = useI18n()
const editor = useEditorStore()

const hasImage = computed(() => editor.source !== null)
</script>

<template>
  <main
    class="safe-area mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 sm:gap-7 sm:px-6 sm:py-8"
  >
    <TopBar />

    <!-- Empty state ------------------------------------------------ -->
    <ImageDropzone v-if="!hasImage" />

    <!-- Editor ----------------------------------------------------- -->
    <template v-else>
      <EditorCanvas />

      <!-- Frame panel: aspect ratio selection -->
      <M3Card variant="filled">
        <header class="mb-4 flex items-center gap-2 text-on-surface">
          <Icon name="aspect-ratio" :size="20" class="text-primary" />
          <h2 class="text-sm font-medium tracking-wide uppercase">
            {{ t('section.frame') }}
          </h2>
        </header>
        <RatioSelector />
      </M3Card>

      <!-- Look panel: background fill + foreground scale -->
      <M3Card variant="filled">
        <header class="mb-4 flex items-center gap-2 text-on-surface">
          <Icon name="palette" :size="20" class="text-primary" />
          <h2 class="text-sm font-medium tracking-wide uppercase">
            {{ t('section.look') }}
          </h2>
        </header>
        <div class="flex flex-col gap-6">
          <FillControls />
          <div class="h-px bg-outline-variant/60" aria-hidden="true" />
          <ScaleControl />
        </div>
      </M3Card>

      <!-- Export panel: format + download CTA -->
      <M3Card variant="elevated">
        <header class="mb-4 flex items-center gap-2 text-on-surface">
          <Icon name="download" :size="20" class="text-primary" />
          <h2 class="text-sm font-medium tracking-wide uppercase">
            {{ t('section.export') }}
          </h2>
        </header>
        <DownloadBar />
      </M3Card>
    </template>

    <footer class="mt-auto flex flex-col items-center gap-1 pt-6 text-center text-xs text-on-surface-variant/70">
      <span>No Crop · {{ t('app.tagline') }}</span>
    </footer>
  </main>
</template>
