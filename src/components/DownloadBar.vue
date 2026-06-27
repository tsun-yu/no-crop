<script setup lang="ts">
/**
 * DownloadBar — format picker + Download + Reset + Change-image.
 *
 * Download path (SPEC §3.5):
 *   1. Compute export size from source dimensions × ratio, clamped to iOS area cap
 *   2. Call useRenderer.renderToBlob() — reuses the SAME renderFrame() module
 *      as the preview, so output is WYSIWYG with what the user sees
 *   3. Save with a suggested filename derived from the original
 *
 * The user can swap between PNG / JPEG; the JPEG quality default comes from
 * settingsStore. PNG is the default because solid-color fills compress lossily
 * with visible banding under JPEG.
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '@/stores/editorStore'
import { useSettingsStore, type ExportFormat } from '@/stores/settingsStore'
import { useRenderer } from '@/composables/useRenderer'
import { getExportPx } from '@/render/exportSize'
import { downloadBlob, suggestFilename } from '@/utils/downloadBlob'
import M3Button from './ui/M3Button.vue'
import M3SegmentedButton from './ui/M3SegmentedButton.vue'

const { t } = useI18n()
const editor = useEditorStore()
const settings = useSettingsStore()
const { renderToBlob } = useRenderer()

const exporting = ref(false)

const formatOptions = computed(() => [
  { value: 'png' as ExportFormat, label: t('export.format.png') },
  { value: 'jpeg' as ExportFormat, label: t('export.format.jpeg') },
])

const exportPx = computed(() => {
  if (!editor.source) return { w: 0, h: 0 }
  return getExportPx({ width: editor.source.width, height: editor.source.height }, editor.ratio)
})

async function onDownload() {
  if (!editor.source || exporting.value) return
  exporting.value = true
  try {
    const mime: 'image/png' | 'image/jpeg' =
      settings.defaultFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
    const quality =
      settings.defaultFormat === 'jpeg' ? settings.defaultJpegQuality / 100 : undefined

    const blob = await renderToBlob(
      {
        source: editor.source,
        fill: editor.fill,
        foregroundScale: editor.foregroundScale,
        outputPx: exportPx.value,
      },
      mime,
      quality,
    )
    const ext: 'png' | 'jpg' = settings.defaultFormat === 'jpeg' ? 'jpg' : 'png'
    downloadBlob(blob, suggestFilename(editor.sourceFilename, editor.ratio, ext))
  } finally {
    exporting.value = false
  }
}

function onChangeImage() {
  editor.clearSource()
}

function onReset() {
  editor.reset()
}
</script>

<template>
  <section
    aria-labelledby="export-label"
    class="flex flex-col gap-4 border-t border-outline-variant pt-5"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 id="export-label" class="text-sm font-medium text-on-surface-variant">
        {{ t('export.format.label') }}
      </h3>
      <M3SegmentedButton
        :model-value="settings.defaultFormat"
        :options="formatOptions"
        :aria-label="t('export.format.label')"
        @update:model-value="(v) => settings.setDefaultFormat(v as ExportFormat)"
      />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <span class="font-mono text-xs text-on-surface-variant">
        {{ exportPx.w }} × {{ exportPx.h }} px
      </span>
      <div class="flex flex-wrap items-center gap-2">
        <M3Button variant="text" @click="onChangeImage">
          {{ t('action.change_image') }}
        </M3Button>
        <M3Button variant="tonal" @click="onReset">
          {{ t('action.reset') }}
        </M3Button>
        <M3Button variant="filled" :disabled="exporting" @click="onDownload">
          {{ exporting ? '…' : t('action.download') }}
        </M3Button>
      </div>
    </div>
  </section>
</template>
