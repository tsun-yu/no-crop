/**
 * Type-safety for translation keys.
 *
 * Module-augments vue-i18n with the shape of the canonical en.json file
 * (single source of truth). Once this file is in the TS project, calls to
 * t('some.key') gain autocomplete + compile-time checking everywhere,
 * including inside <template>.
 */

import type enMessages from '@/locales/en.json'

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends Record<string, unknown> {
    readonly app: (typeof enMessages)['app']
    readonly action: (typeof enMessages)['action']
    readonly upload: (typeof enMessages)['upload']
    readonly ratio: (typeof enMessages)['ratio']
    readonly fill: (typeof enMessages)['fill']
    readonly scale: (typeof enMessages)['scale']
    readonly export: (typeof enMessages)['export']
    readonly theme: (typeof enMessages)['theme']
    readonly locale: (typeof enMessages)['locale']
    readonly settings: (typeof enMessages)['settings']
    readonly error: (typeof enMessages)['error']
  }
}

export {}
