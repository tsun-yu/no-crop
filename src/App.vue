<script setup lang="ts">
/**
 * App.vue — the editor shell.
 *
 * Layout:
 *
 *   TopBar (branding + theme + locale)
 *   PrivacyChip
 *   ──────────────────────────────────
 *   ImageDropzone   ← shown when no image loaded
 *      OR
 *   EditorCanvas    ← live WYSIWYG preview
 *   RatioSelector
 *   FillControls
 *   ScaleControl
 *   DownloadBar
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

// Bootstrap the M3 theme (re-applies whenever seed or scheme changes)
useM3Theme()

const { t } = useI18n()
const editor = useEditorStore()

const hasImage = computed(() => editor.source !== null)
</script>

<template>
  <main
    class="safe-area mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-6 sm:gap-8 sm:px-6 sm:py-8"
  >
    <TopBar />

    <!-- Privacy chip -->
    <div
      class="inline-flex w-fit items-center gap-2 rounded-md-full bg-secondary-container px-4 py-2 text-xs text-on-secondary-container shadow-md-elev-1 sm:text-sm"
    >
      <span aria-hidden="true">🔒</span>
      <span>{{ t('app.privacy.chip') }}</span>
    </div>

    <!-- Empty state ------------------------------------------------ -->
    <ImageDropzone v-if="!hasImage" />

    <!-- Editor ----------------------------------------------------- -->
    <template v-else>
      <EditorCanvas />

      <M3Card variant="filled">
        <div class="flex flex-col gap-6">
          <RatioSelector />
          <FillControls />
          <ScaleControl />
          <DownloadBar />
        </div>
      </M3Card>
    </template>

    <footer class="mt-auto pt-6 text-center text-xs text-on-surface-variant">
      No Crop · {{ t('app.tagline') }}
    </footer>
  </main>
</template>
