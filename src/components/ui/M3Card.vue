<script setup lang="ts">
/**
 * M3Card — filled / outlined / elevated container.
 * Defaults to "filled" (surface-container-low) to suit the editor panels.
 */

import { computed } from 'vue'

type Variant = 'filled' | 'outlined' | 'elevated'

interface Props {
  variant?: Variant
}

const props = withDefaults(defineProps<Props>(), { variant: 'filled' })

const classes = computed(() => {
  switch (props.variant) {
    case 'outlined':
      return 'border border-outline-variant bg-transparent'
    case 'elevated':
      return 'bg-surface-container-low shadow-md-elev-1'
    case 'filled':
    default:
      return 'bg-surface-container'
  }
})
</script>

<template>
  <div class="rounded-md-xl p-5" :class="classes">
    <slot />
  </div>
</template>
