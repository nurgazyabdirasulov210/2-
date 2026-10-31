/** Sequential safelight → ember ramp (one hue family, dark → bright). */
export const HEAT_LEVELS = [
  'var(--surface-2)',
  'color-mix(in srgb, var(--safelight) 34%, var(--surface-2))',
  'color-mix(in srgb, var(--safelight) 66%, var(--surface-2))',
  'var(--safelight)',
  'var(--data-1)',
]
