<script setup lang="ts">
/**
 * M3Button — Material 3 button (filled / tonal / outlined / text / elevated).
 *
 * Includes M3 Expressive press feedback: subtle scale-down + state layer
 * (overlay tinted with on-color × pressed opacity). Springy via CSS
 * transitions (motion-v reserved for components that need layout animation).
 */

import { computed } from 'vue'

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated'

interface Props {
  variant?: Variant
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'filled',
  type: 'button',
  disabled: false,
  fullWidth: false,
})

defineEmits<{ click: [event: MouseEvent] }>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'tonal':
      return 'bg-secondary-container text-on-secondary-container hover:shadow-md-elev-1'
    case 'outlined':
      return 'border border-outline text-primary bg-transparent hover:bg-primary/8'
    case 'text':
      return 'text-primary bg-transparent hover:bg-primary/8'
    case 'elevated':
      return 'bg-surface-container-low text-primary shadow-md-elev-1 hover:shadow-md-elev-2'
    case 'filled':
    default:
      return 'bg-primary text-on-primary hover:shadow-md-elev-1'
  }
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-2 rounded-md-full px-6 py-2.5 text-sm font-medium transition-[transform,box-shadow,background-color,color] duration-200 ease-md-standard select-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
    :class="[variantClasses, fullWidth ? 'w-full' : '']"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
