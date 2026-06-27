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
import Icon from './ui/Icon.vue'

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
  <section aria-labelledby="export-label" class="flex flex-col gap-4">
    <!-- Format selector — full-width segmented button so it reads as the
         primary control for this export section. -->
    <M3SegmentedButton
      :model-value="settings.defaultFormat"
      :options="formatOptions"
      :aria-label="t('export.format.label')"
      class="self-stretch"
      @update:model-value="(v) => settings.setDefaultFormat(v as ExportFormat)"
    />

    <!-- Output preview row: pixel dimensions + format pill. Stays visible so
         the user always knows exactly what they're about to download. -->
    <div
      class="flex flex-wrap items-center justify-between gap-2 rounded-md-lg bg-surface-container-low px-4 py-3"
    >
      <span class="text-xs font-medium uppercase tracking-wider text-on-surface-variant">
        {{ t('export.output_size') }}
      </span>
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center rounded-md-full bg-primary-container px-3 py-1 font-mono text-sm font-semibold text-on-primary-container tabular-nums"
        >
          {{ exportPx.w.toLocaleString() }} × {{ exportPx.h.toLocaleString() }}
        </span>
        <span
          class="inline-flex items-center rounded-md-full bg-secondary-container px-2.5 py-1 text-xs font-semibold uppercase text-on-secondary-container"
        >
          {{ settings.defaultFormat }}
        </span>
      </div>
    </div>

    <!-- Primary CTA — full-width filled button with the download glyph. -->
    <M3Button
      variant="filled"
      :disabled="exporting"
      full-width
      class="py-3! text-base shadow-md-elev-1 hover:shadow-md-elev-2"
      @click="onDownload"
    >
      <Icon
        :name="exporting ? 'refresh' : 'download'"
        :size="20"
        :class="exporting ? 'animate-spin' : ''"
      />
      <span>{{ exporting ? t('action.downloading') : t('action.download') }}</span>
    </M3Button>

    <!-- Secondary actions — equal-weight text buttons so neither competes
         with the primary download CTA above. -->
    <div class="flex items-center justify-center gap-1">
      <M3Button variant="text" @click="onChangeImage">
        <Icon name="image" :size="16" />
        <span>{{ t('action.change_image') }}</span>
      </M3Button>
      <span class="text-on-surface-variant/40" aria-hidden="true">·</span>
      <M3Button variant="text" @click="onReset">
        <Icon name="refresh" :size="16" />
        <span>{{ t('action.reset') }}</span>
      </M3Button>
    </div>
  </section>
</template>
