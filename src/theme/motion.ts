/**
 * Material 3 motion spring presets, mapped to motion-v / Motion One spring config.
 *
 * `spatial` springs are for position / size changes (overshoot OK).
 * `effects` springs are for color / opacity (no overshoot — `damping ≥ critical`).
 *
 * Values approximate the M3 MotionScheme spec. Tune per-component as needed.
 */

export type SpringConfig = {
  type: 'spring'
  stiffness: number
  damping: number
  mass?: number
}

export const m3Springs = {
  // Spatial: physical motion
  fastSpatial: { type: 'spring', stiffness: 1400, damping: 38 } satisfies SpringConfig,
  defaultSpatial: { type: 'spring', stiffness: 700, damping: 32 } satisfies SpringConfig,
  slowSpatial: { type: 'spring', stiffness: 350, damping: 30 } satisfies SpringConfig,

  // Effects: color / opacity (critically damped to avoid overshoot)
  fastEffects: { type: 'spring', stiffness: 3800, damping: 100 } satisfies SpringConfig,
  defaultEffects: { type: 'spring', stiffness: 1600, damping: 80 } satisfies SpringConfig,
  slowEffects: { type: 'spring', stiffness: 800, damping: 60 } satisfies SpringConfig,
} as const

export type M3SpringName = keyof typeof m3Springs
