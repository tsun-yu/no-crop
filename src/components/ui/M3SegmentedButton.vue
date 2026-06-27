<script setup lang="ts">
/**
 * M3SegmentedButton — pick exactly one option from a small set.
 *
 * Used by:
 *   - Theme switcher (System / Light / Dark)
 *   - Fill mode (Solid / Blur)
 *   - Language switcher
 *
 * Renders as a pill-shaped row. The selected segment gets the
 * secondary-container surface + a leading check icon (M3 spec).
 */

interface Option<T extends string | number> {
  value: T
  label: string
  /** Optional Material Symbol name shown before label (only if not selected). */
  icon?: string
}

const props = defineProps<{
  modelValue: string | number
  options: ReadonlyArray<Option<string | number>>
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

function select(v: string | number) {
  if (v !== props.modelValue) emit('update:modelValue', v)
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="ariaLabel"
    class="inline-flex divide-x divide-outline overflow-hidden rounded-md-full border border-outline"
  >
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="opt.value === modelValue"
      class="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors duration-200 ease-md-standard first:rounded-l-md-full last:rounded-r-md-full"
      :class="
        opt.value === modelValue
          ? 'bg-secondary-container text-on-secondary-container'
          : 'text-on-surface hover:bg-on-surface/8'
      "
      @click="select(opt.value)"
    >
      <span v-if="opt.value === modelValue" aria-hidden="true">✓</span>
      <span>{{ opt.label }}</span>
    </button>
  </div>
</template>
