<script setup lang="ts">
/**
 * M3Chip — assist / filter / suggestion chip.
 *
 * Used for ratio presets and color swatches.
 * The `selected` state applies the secondary-container surface tint.
 */

interface Props {
  selected?: boolean
  disabled?: boolean
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  ariaLabel: undefined,
})

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="selected"
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="inline-flex shrink-0 items-center gap-1.5 rounded-md-sm border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 ease-md-standard active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
    :class="
      selected
        ? 'border-secondary bg-secondary-container text-on-secondary-container'
        : 'border-outline-variant text-on-surface hover:bg-on-surface/8'
    "
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
