<script setup lang="ts">
/**
 * M3IconButton — circular icon button with optional press-time shape morph
 * (border-radius interpolates toward `var(--md-sys-shape-corner-medium)`).
 *
 * Variants:
 *   - standard: transparent bg, on-surface-variant icon
 *   - tonal:    secondary-container bg
 *   - filled:   primary bg
 *   - outlined: outline-only
 */

import { computed } from 'vue'

type Variant = 'standard' | 'tonal' | 'filled' | 'outlined'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  ariaLabel: string
  disabled?: boolean
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'standard',
  size: 'md',
  disabled: false,
  active: false,
})

defineEmits<{ click: [event: MouseEvent] }>()

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-9 w-9 text-[18px]'
    case 'lg':
      return 'h-14 w-14 text-[28px]'
    case 'md':
    default:
      return 'h-11 w-11 text-[22px]'
  }
})

const variantClasses = computed(() => {
  if (props.active) {
    switch (props.variant) {
      case 'tonal':
        return 'bg-secondary text-on-secondary'
      case 'filled':
        return 'bg-primary text-on-primary'
      case 'outlined':
        return 'border border-primary bg-primary text-on-primary'
      default:
        return 'bg-primary-container text-on-primary-container'
    }
  }
  switch (props.variant) {
    case 'tonal':
      return 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80'
    case 'filled':
      return 'bg-primary text-on-primary hover:shadow-md-elev-1'
    case 'outlined':
      return 'border border-outline text-on-surface-variant hover:bg-on-surface-variant/8'
    case 'standard':
    default:
      return 'text-on-surface-variant hover:bg-on-surface-variant/8'
  }
})
</script>

<template>
  <button
    type="button"
    :aria-label="ariaLabel"
    :aria-pressed="active"
    :disabled="disabled"
    class="inline-flex items-center justify-center rounded-md-full transition-[border-radius,transform,background-color,color,box-shadow] duration-200 ease-md-standard active:scale-95 active:rounded-md-md disabled:cursor-not-allowed disabled:opacity-40"
    :class="[sizeClasses, variantClasses]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
