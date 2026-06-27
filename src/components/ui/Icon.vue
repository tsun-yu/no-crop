<script setup lang="ts">
/**
 * Icon — minimal inline SVG icon library, drawn at 24×24 viewBox.
 *
 * We use a small hand-picked set with path data ported from Material
 * Symbols (outlined, weight 400). Keeps the bundle small and avoids
 * shipping a 100KB icon font for the ~10 glyphs we actually need.
 *
 * Add new glyphs by appending to PATHS below.
 *
 * Color inherits from `currentColor` so utility classes like
 * `text-on-primary` work as expected on the wrapping element.
 */

import { computed } from 'vue'

export type IconName =
  | 'download'
  | 'image'
  | 'palette'
  | 'tune'
  | 'aspect-ratio'
  | 'swap'
  | 'shield'
  | 'sparkle'
  | 'plus'
  | 'check'
  | 'close'
  | 'refresh'
  | 'paste'

interface Props {
  name: IconName
  /** Pixel size of the icon. Defaults to 20. */
  size?: number
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), { size: 20, ariaLabel: undefined })

// Material Symbols Outlined path data, normalised to 24x24.
const PATHS: Record<IconName, string> = {
  // Download arrow into a tray
  download:
    'M12 16l-5-5h3V4h4v7h3l-5 5zM5 20v-2h14v2H5z',
  // Image / picture frame
  image:
    'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.9 13.98l2.1 2.53 3.1-3.99L18 18H6l2.9-4.02z',
  // Palette
  palette:
    'M12 22C6.49 22 2 17.51 2 12S6.04 2 12 2c5.51 0 10 4.04 10 9 0 3.31-2.69 6-6 6h-1.77c-.28 0-.5.22-.5.5 0 .12.05.23.13.33.41.47.64 1.06.64 1.67A2.5 2.5 0 0 1 12 22zm0-18c-4.41 0-8 3.59-8 8s3.59 8 8 8c.28 0 .5-.22.5-.5a.54.54 0 0 0-.14-.35c-.41-.46-.63-1.05-.63-1.65a2.5 2.5 0 0 1 2.5-2.5H16c2.21 0 4-1.79 4-4 0-3.86-3.59-7-8-7zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4A1.5 1.5 0 1 1 9.5 6 1.5 1.5 0 0 1 10.5 9zm5 0A1.5 1.5 0 1 1 14.5 6 1.5 1.5 0 0 1 15.5 9zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
  // Sliders / tune
  tune:
    'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z',
  // Aspect ratio / crop
  'aspect-ratio':
    'M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z',
  // Swap horizontal
  swap:
    'M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z',
  // Shield (privacy)
  shield:
    'M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 9.99h6c-.45 3.71-2.92 7.05-6 8.01v-8h-6V6.3l6-2.25v7.94z',
  // Sparkle / auto-awesome
  sparkle:
    'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25zM11.5 9.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12z',
  // Plus
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  // Check
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  // Close X
  close:
    'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  // Refresh
  refresh:
    'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  // Paste / content paste
  paste:
    'M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM12 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z',
}

const d = computed(() => PATHS[props.name])
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    :aria-label="ariaLabel"
    :aria-hidden="ariaLabel ? undefined : true"
    :role="ariaLabel ? 'img' : 'presentation'"
    fill="currentColor"
    class="inline-block shrink-0"
  >
    <path :d="d" />
  </svg>
</template>
