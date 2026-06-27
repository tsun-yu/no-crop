<script setup lang="ts">
/**
 * M3Slider — Material 3 Expressive slider with wavy active track.
 *
 * Design (SPEC §4.9):
 *   - Inactive track: thin straight line (outline-variant)
 *   - Active track: sine-wave SVG path that animates a traveling phase
 *     when not being dragged. Wave amplitude collapses to 0 at 0% / 100%.
 *   - Handle: filled primary circle, scales 1 → 1.15 on press
 *
 * Accessibility:
 *   - Native ARIA roles (role=slider) with valuemin/max/now
 *   - Keyboard: ArrowLeft/Right (+/- step), Home/End, PageUp/Down (10×step)
 *   - Pointer Events for cross-platform drag (mouse, touch, pen)
 *   - touch-action: none on track to prevent page scroll interference
 *
 * Reduced motion:
 *   - prefers-reduced-motion: reduce → static wave (no phase animation)
 */

import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  ariaLabel?: string
  /** Disable the active-track sine wave (preserves space but uses straight line) */
  flat?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  ariaLabel: undefined,
  flat: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const reducedMotion = usePreferredReducedMotion()

// ── Track + handle geometry ──────────────────────────────────────────
const TRACK_HEIGHT = 16 // px reserved for the SVG band (wave amplitude room)
const MID = TRACK_HEIGHT / 2
const HANDLE_R = 10
const WAVE_AMPLITUDE = 3
const WAVE_WAVELENGTH = 28

const trackEl = useTemplateRef<HTMLDivElement>('trackEl')
const trackWidth = ref(0)
const isDragging = ref(false)
const isHovered = ref(false)

function refreshTrackWidth() {
  if (!trackEl.value) return
  trackWidth.value = trackEl.value.clientWidth
}

const ro = new ResizeObserver(() => refreshTrackWidth())
watch(trackEl, (el, _, onCleanup) => {
  if (!el) return
  refreshTrackWidth()
  ro.observe(el)
  onCleanup(() => ro.unobserve(el))
})

onUnmounted(() => ro.disconnect())

const pct = computed(() => {
  const range = props.max - props.min
  if (range <= 0) return 0
  return Math.min(1, Math.max(0, (props.modelValue - props.min) / range))
})

const handleCx = computed(() => HANDLE_R + (trackWidth.value - HANDLE_R * 2) * pct.value)

// ── Wave path ────────────────────────────────────────────────────────
const phase = ref(0)
let rafId = 0
let lastT = 0

function tick(t: number) {
  if (!lastT) lastT = t
  const dt = (t - lastT) / 1000
  lastT = t
  // ~1.2 wavelengths per second drift; pause while dragging
  if (!isDragging.value && reducedMotion.value === 'no-preference') {
    phase.value = (phase.value + dt * 1.2 * Math.PI * 2) % (Math.PI * 2)
  }
  rafId = requestAnimationFrame(tick)
}
rafId = requestAnimationFrame(tick)
onUnmounted(() => cancelAnimationFrame(rafId))

/** Build the active-track wave path, collapsing amplitude to 0 at edges. */
const wavePath = computed(() => {
  const w = handleCx.value
  if (w <= 0 || props.flat) return `M0 ${MID} H${w}`
  // Smoothly fade amplitude at extremes (0%, 100%)
  const p = pct.value
  const ampFactor = Math.sin(Math.min(1, p) * Math.PI) // 0 at 0%, 1 at 50%, 0 at 100%
  const amp = WAVE_AMPLITUDE * ampFactor
  if (amp < 0.05) return `M0 ${MID} H${w}`
  const points: string[] = [`M 0 ${MID}`]
  const step = 2
  for (let x = step; x <= w; x += step) {
    const y = MID + amp * Math.sin((x / WAVE_WAVELENGTH) * Math.PI * 2 + phase.value)
    points.push(`L ${x.toFixed(2)} ${y.toFixed(3)}`)
  }
  return points.join(' ')
})

// ── Pointer drag ─────────────────────────────────────────────────────
function valueFromClientX(clientX: number): number {
  if (!trackEl.value) return props.modelValue
  const rect = trackEl.value.getBoundingClientRect()
  const usable = rect.width - HANDLE_R * 2
  const x = Math.min(rect.width - HANDLE_R, Math.max(HANDLE_R, clientX - rect.left)) - HANDLE_R
  const ratio = usable > 0 ? x / usable : 0
  const raw = props.min + ratio * (props.max - props.min)
  return snap(raw)
}

function snap(v: number): number {
  const s = props.step || 1
  const snapped = Math.round((v - props.min) / s) * s + props.min
  return clamp(snapped)
}

function clamp(v: number): number {
  return Math.min(props.max, Math.max(props.min, v))
}

function commit(next: number) {
  if (next !== props.modelValue) emit('update:modelValue', next)
}

function onPointerDown(e: PointerEvent) {
  if (!trackEl.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  isDragging.value = true
  commit(valueFromClientX(e.clientX))
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return
  commit(valueFromClientX(e.clientX))
}

function onPointerUp(e: PointerEvent) {
  isDragging.value = false
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* already released */
  }
}

function onKeyDown(e: KeyboardEvent) {
  let next = props.modelValue
  const big = props.step * 10
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      next = clamp(props.modelValue - props.step)
      break
    case 'ArrowRight':
    case 'ArrowUp':
      next = clamp(props.modelValue + props.step)
      break
    case 'PageDown':
      next = clamp(props.modelValue - big)
      break
    case 'PageUp':
      next = clamp(props.modelValue + big)
      break
    case 'Home':
      next = props.min
      break
    case 'End':
      next = props.max
      break
    default:
      return
  }
  e.preventDefault()
  commit(next)
}
</script>

<template>
  <div
    ref="trackEl"
    role="slider"
    tabindex="0"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="modelValue"
    :aria-label="ariaLabel"
    class="group relative h-10 w-full cursor-pointer touch-none outline-none select-none"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeyDown"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- SVG band centered vertically -->
    <svg
      :width="trackWidth"
      :height="TRACK_HEIGHT"
      :viewBox="`0 0 ${trackWidth} ${TRACK_HEIGHT}`"
      class="absolute top-1/2 left-0 -translate-y-1/2"
      aria-hidden="true"
    >
      <!-- inactive track (right portion) -->
      <line
        :x1="handleCx + HANDLE_R + 4"
        :y1="MID"
        :x2="trackWidth"
        :y2="MID"
        stroke="var(--md-sys-color-surface-container-highest)"
        stroke-width="4"
        stroke-linecap="round"
      />
      <!-- active track wave (left portion) -->
      <path
        :d="wavePath"
        fill="none"
        stroke="var(--md-sys-color-primary)"
        stroke-width="4"
        stroke-linecap="round"
      />
      <!-- handle -->
      <circle
        :cx="handleCx"
        :cy="MID"
        :r="isDragging ? HANDLE_R + 1.5 : HANDLE_R - 2"
        fill="var(--md-sys-color-primary)"
        :stroke="isHovered ? 'var(--md-sys-color-primary)' : 'transparent'"
        stroke-opacity="0.12"
        :stroke-width="isHovered ? 14 : 0"
        class="transition-[r,stroke-width]"
      />
    </svg>
  </div>
</template>
