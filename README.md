# No Crop

A privacy-first, WYSIWYG web app for resizing images to any aspect ratio
**without cropping**. Extra space is filled with a chosen solid color or a
blurred version of the image. Fully client-side — images never leave your
device.

> **Status:** scaffold v0.1 — design tokens, theme switching, and i18n are
> live. The editor canvas, render pipeline, and M3 component library land in
> subsequent milestones (see `SPEC.md` Appendix A).

## Stack

- **Vite 6** + **Vue 3.5 (Composition API)** + **TypeScript 5**
- **Tailwind CSS v4** with `@theme inline` mapping to M3 design tokens
- **`@material/material-color-utilities`** for HCT-based dynamic color (one
  seed → both light and dark schemes)
- **Pinia 2** for state, **vue-i18n 11** for zh-TW / en bilingual UI
- **vite-plugin-pwa** for offline-first PWA shell

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build to dist/
npm run preview      # serve dist/
npm run type-check
npm run lint
npm run format
npm run test
```

## Project structure

See `SPEC.md` §8 for the canonical file layout. The current scaffold
implements:

- `src/styles/` — Tailwind v4 entry, static M3 tokens, base styles
- `src/theme/` — brand seed, motion spring presets, MCU theme injector
- `src/composables/` — `useColorScheme`, `useM3Theme`, `useLocale`
- `src/stores/` — Pinia `editor` and `settings` stores
- `src/i18n/` + `src/locales/` — vue-i18n setup with type-safe keys
- `src/config/` — aspect ratio presets, app constants
- `src/App.vue` — minimal landing showing theme + i18n wired together

## Specification

Full functional and architectural spec is in [`SPEC.md`](./SPEC.md).
The **WYSIWYG render pipeline** (§3) is the architectural cornerstone — all
future work must respect its invariants.
