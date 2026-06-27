<script setup lang="ts">
/**
 * BrandMark — small inline SVG logo used in the TopBar / favicon.
 *
 * The shape mirrors `public/favicon.svg`: rounded square + inner frame
 * with a check mark, expressing "no-crop" as a sanctioned frame.
 *
 * Colors are bound to live M3 tokens so the mark re-tints when the
 * scheme switches (light/dark) and when the user reseeds the theme.
 */

interface Props {
  /** Pixel size of the bounding box. Defaults to 32. */
  size?: number
  /** Aria label for screen readers. */
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), { size: 32, ariaLabel: 'No Crop logo' })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    role="img"
    :aria-label="ariaLabel"
    class="block shrink-0"
  >
    <rect width="32" height="32" rx="8" fill="var(--md-sys-color-primary)" />
    <rect
      x="6"
      y="6"
      width="20"
      height="20"
      rx="3"
      stroke="var(--md-sys-color-on-primary)"
      stroke-width="2"
      fill="none"
    />
    <path
      d="M10 18l4-4 3 3 5-5"
      stroke="var(--md-sys-color-on-primary)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>
