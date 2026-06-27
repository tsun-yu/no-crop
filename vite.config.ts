import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        VueI18nPlugin({
            include: [fileURLToPath(new URL('./src/locales/**', import.meta.url))],
            strictMessage: true,
            runtimeOnly: true,
        }),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false, // 由 src/registerSW.ts 手動註冊以便顯示更新提示
            devOptions: { enabled: true },
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
                name: 'No Crop',
                short_name: 'NoCrop',
                description: 'Resize images to any aspect ratio without cropping.',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                background_color: '#FFFBFE',
                theme_color: '#6750A4',
                orientation: 'any',
                lang: 'zh-TW',
                icons: [
                    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    {
                        src: '/icons/icon-maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,wasm}'],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        target: 'es2022',
        sourcemap: true,
    },
})
