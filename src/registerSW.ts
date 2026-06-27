/**
 * Service worker registration with auto-update prompt support.
 *
 * The `vite-plugin-pwa` virtual module exposes a Vue composable that returns
 * reactive refs for `needRefresh`, `offlineReady`, and an updater function.
 *
 * This file just re-exports it for use by an in-app prompt component.
 */

export { useRegisterSW } from 'virtual:pwa-register/vue'
