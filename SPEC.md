# No Crop — 規格文件 (SPEC)

> 一個純前端、所見即所得 (WYSIWYG) 的「不裁切」圖片轉框工具。
> 將任意比例的圖片包成 1:1（或其他社群常用比例），多餘空間以**純色**或**模糊原圖**填滿。

- 文件版本：v1.0
- 最後更新：2026-06-06
- 語言：繁體中文（技術名詞保留英文）

---

## 目錄

1. [產品概述](#1-產品概述)
2. [技術棧與套件](#2-技術棧與套件)
3. [渲染管線 — WYSIWYG 保證 (核心)](#3-渲染管線--wysiwyg-保證-核心)
4. [設計系統 — Material 3 Expressive](#4-設計系統--material-3-expressive)
5. [主題切換 (System / Light / Dark)](#5-主題切換-system--light--dark)
6. [國際化 (i18n)](#6-國際化-i18n)
7. [功能規格](#7-功能規格)
8. [檔案結構與 Composables](#8-檔案結構與-composables)
9. [PWA 設定](#9-pwa-設定)
10. [iOS / Safari 相容性檢查表](#10-ios--safari-相容性檢查表)
11. [效能與無障礙](#11-效能與無障礙)
12. [Roadmap](#12-roadmap)
13. [Glossary / 名詞表](#13-glossary--名詞表)

---

## 1. 產品概述

### 1.1 一句話定位

**「不裁切地把任意比例圖片變成社群可發的方形（或其他比例），並用純色或模糊原圖填滿邊界。」**

### 1.2 目標使用者

- 想把直式 / 橫式照片發到 IG 動態而不被裁切的一般用戶
- 設計師快速為社群圖加底色 / 模糊背景
- 主要裝置：iPhone (iOS Safari)、Android Chrome、Mac Safari、桌機 Chrome / Firefox / Edge

### 1.3 核心價值

1. **零裁切**：原圖完整呈現，多餘區域才填色 / 模糊
2. **所見即所得**：預覽與下載結果像素級一致
3. **隱私優先**：所有處理在瀏覽器內完成，圖片不離開裝置
4. **接近原生 App 的觀感**：Material 3 Expressive 設計語言、PWA 可安裝
5. **跨平台**：所有現代瀏覽器一致運作，特別針對 iOS Safari 限制做防護

### 1.4 不做的事 (Out of Scope, v1)

- 後端 / 雲端儲存
- 帳號系統 / 登入
- 多圖批次處理（列在 Roadmap）
- 圖層 / 文字疊加 / 貼圖
- AI 智慧構圖建議（列在 Roadmap）
- 影片處理

### 1.5 裝置矩陣

| 平台             | 最低支援版本 | 備註                                           |
| ---------------- | ------------ | ---------------------------------------------- |
| iOS Safari       | 16.4+        | 16.4 才有 OffscreenCanvas，較舊版本走 fallback |
| iPadOS Safari    | 16.4+        | 同上                                           |
| macOS Safari     | 16.4+        |                                                |
| Chrome / Edge    | 100+         |                                                |
| Firefox          | 110+         |                                                |
| Android Chrome   | 100+         |                                                |
| Samsung Internet | 最新         |                                                |

---

## 2. 技術棧與套件

### 2.1 核心技術

| 類別     | 選擇                        | 理由                                                         |
| -------- | --------------------------- | ------------------------------------------------------------ |
| 建置工具 | **Vite 7+**                 | 快、HMR 一流、PWA 整合佳                                     |
| 框架     | **Vue 3 (Composition API)** | 用戶指定                                                     |
| 語言     | **TypeScript 5+**           | 用戶指定，型別安全                                           |
| 樣式     | **Tailwind CSS v4**         | `@theme inline` 支援 runtime CSS variable，完美承接 M3 token |
| 狀態管理 | **Pinia 3+**                | Vue 官方推薦，Composition API 友善                           |
| 路由     | 不使用                      | 單頁工具，用 reactive state 切換視圖                         |

### 2.2 套件清單

#### UI / 動效 / 主題

| 套件                                                  | 用途                                                                                                                                                                                                 | 備註                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `@material/material-color-utilities`                  | M3 動態色彩（HCT、tonal palettes、light/dark schemes）                                                                                                                                               | 官方 Google TS 套件                          |
| `motion-v`                                            | 彈簧動效（M3 motion-physics spec）                                                                                                                                                                   | Motion One for Vue，layout animation 支援    |
| `@vueuse/core@^14`                                    | `useColorMode` / `usePreferredDark` / `usePreferredLanguages` / `useEventListener` / `useDropZone` / `useFileDialog` / `useObjectUrl` / `useStyleTag` / `useLocalStorage` / `useDevicePixelRatio` 等 |                                              |
| `flubber` (optional)                                  | SVG path morph（複雜形狀，可延後）                                                                                                                                                                   | 簡單 squircle↔circle 用 `border-radius` 即可 |
| Material Symbols Rounded (variable font, self-hosted) | 圖示                                                                                                                                                                                                 | subset 只含實際用到的 icon                   |
| Roboto Flex (variable, self-hosted)                   | 主字體                                                                                                                                                                                               | 支援 M3 type scale 所有 axes                 |
| Noto Sans TC (variable, self-hosted)                  | CJK fallback                                                                                                                                                                                         | 繁中字型                                     |

#### 影像處理

| 套件                     | 用途                 | 備註                                                |
| ------------------------ | -------------------- | --------------------------------------------------- |
| `stackblur-canvas`       | 跨瀏覽器 Canvas 模糊 | **取代** Safari 不支援的 `ctx.filter = 'blur(...)'` |
| `colorthief` v3+         | 圖片主題色抽取       | Worker-friendly、TS、OKLCH 量化                     |
| `heic2any`               | iOS HEIC → JPEG      | lazy load (~500KB WASM)，只在偵測到 HEIC 時動態載入 |
| `canvas-size` (optional) | iOS canvas 上限探測  | 預設用硬編 4096 上限，需要時再加                    |

#### i18n / PWA

| 套件                         | 用途                                            |
| ---------------------------- | ----------------------------------------------- |
| `vue-i18n@^11`               | 雙語 (zh-TW / en)                               |
| `@intlify/unplugin-vue-i18n` | Vite plugin、JSON 訊息預編譯、SFC `<i18n>` 區塊 |
| `vite-plugin-pwa`            | PWA 與 service worker（Workbox 底層）           |
| `@vite-pwa/assets-generator` | 自動產生 iOS splash / favicon 多尺寸            |

#### 開發工具

| 套件                                                  | 用途                            |
| ----------------------------------------------------- | ------------------------------- |
| `eslint` + `eslint-plugin-vue` + `@typescript-eslint` | Lint                            |
| `prettier` + `prettier-plugin-tailwindcss`            | Format，Tailwind class 自動排序 |
| `vitest`                                              | 單元測試                        |
| `@vue/test-utils`                                     | 元件測試                        |
| `vue-tsc`                                             | TS 型別檢查                     |

### 2.3 不引入的套件

| 不用                                      | 理由                                             |
| ----------------------------------------- | ------------------------------------------------ |
| Vuetify / Naive UI / Element Plus         | 與 M3 Expressive 風格落差大；自製元件更可控      |
| Material Web Components (`@material/web`) | 維護模式中，且非 Expressive                      |
| `html2canvas`                             | 過重且與 WYSIWYG 路徑衝突                        |
| VueUse `useClipboard`                     | 只支援文字 clipboard；圖片需自製 `useImagePaste` |

---

## 3. 渲染管線 — WYSIWYG 保證 (核心)

> **本章是整個 App 的架構基石。所有功能設計都必須遵守此處的不變量 (invariants)。**

### 3.1 設計目標

**預覽畫面像素分布必須與下載結果一致**，僅解析度與壓縮差異不同。任何「只在預覽出現」或「只在匯出出現」的視覺差異都是 bug。

### 3.2 不變量 (Invariants)

#### I1. 單一渲染函式

預覽與匯出**呼叫同一個純函式** `renderFrame()`，差別只在傳入的 `outputPx`。

```ts
// src/render/renderFrame.ts
export interface RenderParams {
  source: ImageBitmap // 解碼後的原圖 (已 iOS-safe downscale)
  frame: { ratio: [number, number] }
  fill: { mode: 'solid'; color: string } | { mode: 'blur'; intensity: number /* 0–100 */ }
  foregroundScale: number // 0.5 – 1.0（前景縮放比例）
  outputPx: { w: number; h: number }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  params: RenderParams,
): void
```

`renderFrame` 是**純函式**：相同輸入 + 相同 `outputPx` → 視覺結果相同；不同 `outputPx` → 等比例縮放的同一畫面。

#### I2. 禁用 `ctx.filter`

**全面禁止**使用 `CanvasRenderingContext2D.filter`（Safari 不支援）。所有模糊一律走 `stackblur-canvas`。

#### I3. 解析度無關的參數系統

所有「pixel-like」參數都以**相對比例**儲存，渲染時才乘上 `outputPx`：

| 參數                      | UI 範圍    | 內部表示          | 對應像素                                                |
| ------------------------- | ---------- | ----------------- | ------------------------------------------------------- |
| 模糊強度                  | 0–100      | `intensity / 100` | `blurPx = intensity/100 × min(outputW, outputH) × 0.06` |
| 前景縮放                  | 50%–100%   | `0.5–1.0`         | 直接套用，與輸出解析度無關                              |
| 填充色                    | hex / rgba | 字串              | 與解析度無關                                            |
| 前景座標 (dx, dy, dw, dh) | —          | ratio (0–1)       | 渲染時乘 outputPx                                       |

> **關鍵**：模糊半徑必須隨 canvas 大小等比縮放。若預覽 1024px 用 30px 模糊，匯出 3000px 必須用 87.9px 才會視覺一致。

#### I4. 同一份 source bitmap

原圖解碼**一次**為 `ImageBitmap`，預覽與匯出共用。

- 大圖（長邊 > 4096）先 downscale 到 ≤4096 後再儲存為 source。
- Downscale 後的 source 即為 "ground truth"，預覽與匯出皆基於此。
- 避免兩次降採樣造成色彩 / 邊緣差異。

#### I5. 一致的取樣設定

兩條路徑都必須設定：

```ts
ctx.imageSmoothingEnabled = true
ctx.imageSmoothingQuality = 'high'
```

#### I6. 一致的合成順序

無論預覽或匯出，順序固定為：

1. 清空 canvas（透明）
2. **背景層**：
   - `solid` → `fillRect` 整個 canvas
   - `blur` → 將 source 以 `cover` 方式繪滿 canvas，再 StackBlur
3. **前景層**：將 source 以 `contain` 方式 + `foregroundScale` 縮放置中繪製

#### I7. Worker 不變式

Worker 與主執行緒 fallback **共用**同一份 `renderFrame.ts`（純函式，不依賴 DOM）。Worker 只負責呼叫它，不額外做任何處理。

### 3.3 渲染流程

```
                    ┌─────────────────────────────┐
File / Paste / Drop │  useImageLoader             │
─────────────────▶  │  ├─ HEIC? → heic2any        │
                    │  ├─ decode → ImageBitmap    │
                    │  └─ downscale (≤4096)       │
                    └────────────┬────────────────┘
                                 │ source: ImageBitmap
                                 ▼
                    ┌─────────────────────────────┐
                    │  Pinia store (editorState)  │
                    │  source, frame, fill,       │
                    │  foregroundScale            │
                    └────┬────────────────────┬───┘
                         │                    │
            (debounced)  │                    │ (on click "Download")
                         ▼                    ▼
              ┌──────────────────┐   ┌──────────────────┐
              │ Preview Renderer │   │ Export Renderer  │
              │ outputPx ≤1024   │   │ outputPx = full  │
              │ (or 1280 desktop)│   │ (iOS-capped)     │
              └────────┬─────────┘   └────────┬─────────┘
                       │                      │
                       └──────┬───────────────┘
                              ▼
                  ┌────────────────────────┐
                  │  renderFrame()         │   ← SAME PURE FUNCTION
                  │  (OffscreenCanvas in   │
                  │   worker if available) │
                  └────────────────────────┘
                              │
              preview ────────┴──────── blob → download / share
```

### 3.4 預覽解析度策略

```ts
// src/render/previewSize.ts
function getPreviewPx(containerCssW: number, dpr: number): number {
  const isMobile = window.innerWidth < 768
  const cap = isMobile ? 1024 : 1280
  return Math.min(cap, Math.ceil(containerCssW * dpr))
}
```

- 預覽 canvas 的 backing store 解析度依容器寬 × DPR，但封頂 1024 (行動) / 1280 (桌面)，避免 slider 拖動掉幀。
- CSS 寬度由容器控制；canvas 用 `width` / `height` attribute 設 backing store px。

### 3.5 匯出解析度策略

```ts
// src/render/exportSize.ts
const IOS_CANVAS_MAX_AREA = 16_777_216 // 4096²

function getExportPx(source: ImageBitmap, ratio: [number, number]) {
  // 1. 以原圖長邊推算目標長邊
  const sourceLong = Math.max(source.width, source.height)
  // 2. 目標長邊 = sourceLong（不放大原圖）
  const [rw, rh] = ratio
  let w: number, h: number
  if (rw >= rh) {
    w = sourceLong
    h = Math.round((sourceLong * rh) / rw)
  } else {
    h = sourceLong
    w = Math.round((sourceLong * rw) / rh)
  }
  // 3. iOS 上限保護（等比例縮小）
  const area = w * h
  if (area > IOS_CANVAS_MAX_AREA) {
    const k = Math.sqrt(IOS_CANVAS_MAX_AREA / area)
    w = Math.floor(w * k)
    h = Math.floor(h * k)
  }
  return { w, h }
}
```

### 3.6 「以匯出尺寸預覽」按鈕

預覽永遠是降採樣版本（為了流暢）。為了讓用戶有信心，提供工具列按鈕：

- **「真實預覽 / Full-size Preview」**：以實際 `getExportPx()` 重新渲染一次到 modal，可放大檢視。
- 此按鈕呼叫的依然是同一個 `renderFrame()`，視覺差異只剩「壓縮」。

### 3.7 JPEG 壓縮差異處理

JPEG 會引入有損壓縮。當用戶選 JPEG 時：

1. 預覽 thumbnail 也用同 `quality` 重新編解碼一次，作為「真實預覽」
2. UI 顯示提示：「JPEG 為有損格式，建議純色背景使用 PNG / 模糊背景使用 JPEG (品質 ≥ 90)」

### 3.8 OffscreenCanvas Worker 策略

```ts
// 偵測
const canUseWorker = typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined'

// 兩條路徑共用 renderFrame.ts
if (canUseWorker) {
  // src/workers/render.worker.ts: postMessage(params, [source])
} else {
  // main thread: renderFrame(ctx, params)
}
```

- Source `ImageBitmap` 是 `Transferable`，零拷貝轉到 worker。
- Worker 渲染完 → `canvas.transferToImageBitmap()` → 主執行緒 `drawImage` 到顯示用 `<canvas>`。
- iOS Safari 16.4 以下走 main thread fallback。

### 3.9 WYSIWYG 測試清單

實作完成後必須通過：

- [ ] 純色填充：預覽截圖 vs 匯出後縮回預覽尺寸 → pixel diff < 1%
- [ ] 模糊填充（強度 50）：同上
- [ ] 前景縮放 75%：同上
- [ ] 切換不同比例 (1:1, 4:5, 9:16)：邊界位置 ratio 一致
- [ ] iOS Safari 大圖 (5000×3000)：自動降階且預覽 = 匯出
- [ ] Chrome / Safari 跨瀏覽器：模糊半徑視覺等效

---

## 4. 設計系統 — Material 3 Expressive

### 4.1 設計原則

Material 3 Expressive (2025+, Android 16/17 系統風格) 的七大戰術：

1. **形狀多樣性** — 圓形、方形混用，35-shape library 概念
2. **濃郁色彩** — HCT 色彩空間，貫徹 primary/secondary/tertiary 三層次
3. **強調字級** — emphasized type styles，hero moment 用大膽尺寸
4. **內含 (Containment)** — 用 surface tint / outline 圈出資訊區塊
5. **流暢動效** — 彈簧物理 (spring)，取代傳統 easing
6. **彈性元件** — FAB menu、Split button、Floating toolbar
7. **Hero moments** — 每螢幕 1–2 個視覺焦點

### 4.2 顏色系統

#### 4.2.1 Token 命名

採用 M3 標準命名，以 CSS variable 注入 `:root` 與 `.dark`：

```
--md-sys-color-primary
--md-sys-color-on-primary
--md-sys-color-primary-container
--md-sys-color-on-primary-container
--md-sys-color-secondary / on / container / on-container
--md-sys-color-tertiary / on / container / on-container
--md-sys-color-error / on / container / on-container
--md-sys-color-surface
--md-sys-color-on-surface
--md-sys-color-surface-variant
--md-sys-color-on-surface-variant
--md-sys-color-surface-dim / bright
--md-sys-color-surface-container-lowest / low / [base] / high / highest
--md-sys-color-inverse-surface / on-inverse-surface / inverse-primary
--md-sys-color-outline
--md-sys-color-outline-variant
--md-sys-color-shadow
--md-sys-color-scrim
```

完整 30+ roles 由 `@material/material-color-utilities` 的 `themeFromSourceColor()` 一次產生。

#### 4.2.2 品牌 Seed

預設品牌 seed：**`#6750A4`** (Material Baseline 紫)

備選（可在程式碼中切換）：

- `#5B6CFF` 友善藍紫
- `#00696D` 冷靜青

#### 4.2.3 圖片色與品牌色的關係

**用戶決策原則 C**：

- App 全域主題永遠以**品牌 seed** 為準，避免每換一張圖 UI 就跳色
- 圖片抽出的 5–8 個主題色僅作為**填充候選 swatches**
- 提供 **「以本圖配色 / Re-theme from image」** 按鈕：用戶主動點擊才用該圖主色 reseed 整個 app 主題
- 主題切換動畫使用 `motion-v` 的 `default-effects` spring (200ms 顏色過渡)

### 4.3 形狀系統

```
--md-sys-shape-corner-none:        0
--md-sys-shape-corner-extra-small: 4px
--md-sys-shape-corner-small:       8px
--md-sys-shape-corner-medium:      12px
--md-sys-shape-corner-large:       16px
--md-sys-shape-corner-extra-large: 28px
--md-sys-shape-corner-full:        9999px
```

**Shape morph 策略**：

- 簡單形狀（按鈕、卡片、icon button）：用 CSS `border-radius` 在 token 間插值
- 複雜 squircle / polygon：用 SVG `clip-path: path(...)`，需要 morph 時引入 `flubber`（v1 不強制）
- 按壓動效 (icon button)：`border-radius: var(--shape-medium)` → `50%`，搭配 `transform: scale(0.96)`，spring 物理

### 4.4 動效系統

#### 4.4.1 Spring Presets

對應 M3 `MotionScheme`：

```ts
// src/theme/motion.ts
export const m3Springs = {
  // Spatial (位置 / 大小變化)
  fastSpatial: { type: 'spring', stiffness: 1400, damping: 38 },
  defaultSpatial: { type: 'spring', stiffness: 700, damping: 32 },
  slowSpatial: { type: 'spring', stiffness: 350, damping: 30 },
  // Effects (顏色 / 透明度，不應 overshoot)
  fastEffects: { type: 'spring', stiffness: 3800, damping: 100 },
  defaultEffects: { type: 'spring', stiffness: 1600, damping: 80 },
  slowEffects: { type: 'spring', stiffness: 800, damping: 60 },
} as const
```

#### 4.4.2 Duration / Easing (備用)

```
--md-sys-motion-duration-short1..4:     50, 100, 150, 200ms
--md-sys-motion-duration-medium1..4:    250, 300, 350, 400ms
--md-sys-motion-duration-long1..4:      450, 500, 550, 600ms
--md-sys-motion-duration-extra-long1..4: 700, 800, 900, 1000ms

--md-sys-motion-easing-standard:               cubic-bezier(0.2, 0, 0, 1)
--md-sys-motion-easing-emphasized:             cubic-bezier(0.2, 0, 0, 1)
--md-sys-motion-easing-emphasized-decelerate:  cubic-bezier(0.05, 0.7, 0.1, 1)
--md-sys-motion-easing-emphasized-accelerate:  cubic-bezier(0.3, 0, 0.8, 0.15)
```

優先用 spring；只有 CSS-only 不便用 spring 的場景才用 duration + easing。

#### 4.4.3 Reduced Motion

`@media (prefers-reduced-motion: reduce)`：所有 spring → 即時轉換 (`duration: 0`)，並關閉色彩過渡。

### 4.5 字級系統

| Role     | Size   | Font px | Line px | Weight regular | Weight emphasized |
| -------- | ------ | ------- | ------- | -------------- | ----------------- |
| display  | large  | 57      | 64      | 400            | 500               |
| display  | medium | 45      | 52      | 400            | 500               |
| display  | small  | 36      | 44      | 400            | 500               |
| headline | large  | 32      | 40      | 400            | 500               |
| headline | medium | 28      | 36      | 400            | 500               |
| headline | small  | 24      | 32      | 400            | 500               |
| title    | large  | 22      | 28      | 400            | 500               |
| title    | medium | 16      | 24      | 500            | 600               |
| title    | small  | 14      | 20      | 500            | 600               |
| body     | large  | 16      | 24      | 400            | 500               |
| body     | medium | 14      | 20      | 400            | 500               |
| body     | small  | 12      | 16      | 400            | 500               |
| label    | large  | 14      | 20      | 500            | 600               |
| label    | medium | 12      | 16      | 500            | 600               |
| label    | small  | 11      | 16      | 500            | 600               |

字型：

- 西文：**Roboto Flex** (variable, 自帶 woff2)
- CJK：**Noto Sans TC** (variable subset)
- 圖示：**Material Symbols Rounded** (variable woff2，subset 只含實際使用的 ligature)

對應 token：

```
--md-sys-typescale-<role>-<size>-font
--md-sys-typescale-<role>-<size>-size
--md-sys-typescale-<role>-<size>-line-height
--md-sys-typescale-<role>-<size>-weight
--md-sys-typescale-<role>-<size>-tracking
```

### 4.6 Elevation / State / Spacing

```
--md-sys-elevation-level0:  none
--md-sys-elevation-level1:  0 1px 2px rgba(0,0,0,.30), 0 1px 3px 1px rgba(0,0,0,.15)
--md-sys-elevation-level2:  0 1px 2px rgba(0,0,0,.30), 0 2px 6px 2px rgba(0,0,0,.15)
--md-sys-elevation-level3:  0 1px 3px rgba(0,0,0,.30), 0 4px 8px 3px rgba(0,0,0,.15)
--md-sys-elevation-level4:  0 2px 3px rgba(0,0,0,.30), 0 6px 10px 4px rgba(0,0,0,.15)
--md-sys-elevation-level5:  0 4px 4px rgba(0,0,0,.30), 0 8px 12px 6px rgba(0,0,0,.15)

--md-sys-state-hover-opacity:   0.08
--md-sys-state-focus-opacity:   0.10
--md-sys-state-pressed-opacity: 0.10
--md-sys-state-dragged-opacity: 0.16
```

### 4.7 圖示 (Material Symbols Rounded)

- 自帶 variable woff2 subset
- 四軸：`FILL` `wght` `GRAD` `opsz`
- 預設：`'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`
- 活躍 (active / selected)：`'FILL' 1, 'wght' 500`
- 過渡：`transition: font-variation-settings 200ms var(--easing-standard)`

封裝為 `<M3Icon name="palette" :filled :weight :grade :size />` 元件。

### 4.8 自製元件清單 (`src/components/ui/`)

| 元件                     | 對應 M3 元件                                       | 備註                                |
| ------------------------ | -------------------------------------------------- | ----------------------------------- |
| `M3Button.vue`           | Filled / Tonal / Outlined / Text / Elevated button | 5 variants，spring 按壓動效         |
| `M3IconButton.vue`       | Icon button (standard / filled / tonal / outlined) | 按壓時 `border-radius` morph 至 50% |
| `M3FAB.vue`              | FAB / Extended FAB                                 | 主操作（如「下載」）                |
| `M3Card.vue`             | Filled / Outlined / Elevated card                  |                                     |
| `M3Slider.vue`           | Slider (with **wavy active track**)                | 見 4.9                              |
| `M3Switch.vue`           | Switch (with handle morph)                         |                                     |
| `M3SegmentedButton.vue`  | Segmented button                                   | 用於 System/Light/Dark 切換         |
| `M3Chip.vue`             | Assist / Filter / Input / Suggestion chip          |                                     |
| `M3Dialog.vue`           | Dialog (full-screen on mobile)                     |                                     |
| `M3BottomSheet.vue`      | Bottom sheet                                       | 行動裝置主控制面板                  |
| `M3Snackbar.vue`         | Snackbar                                           | toast 訊息                          |
| `M3TopAppBar.vue`        | Top app bar (center-aligned, M3 Expressive)        |                                     |
| `M3NavigationBar.vue`    | (預留，v1 單頁不一定用到)                          |                                     |
| `M3ColorPicker.vue`      | 自製 HCT 色相環 (使用 MCU)                         |                                     |
| `M3LoadingIndicator.vue` | M3 Expressive 新版 loading（多形狀變化）           |                                     |
| `M3Icon.vue`             | Material Symbols 包裝                              |                                     |
| `ShapeMorph.vue`         | 通用 border-radius / clip-path morph 容器          |                                     |

### 4.9 Wavy Slider 實作要點

M3 Expressive 的 slider 活躍軌道呈正弦波：

```html
<svg viewBox="0 0 trackW trackH" class="m3-slider-track">
  <!-- 非活躍：直線 -->
  <line x1="0" y1="mid" x2="trackW" y2="mid" class="inactive" />
  <!-- 活躍：sine path -->
  <path :d="wavePath" class="active" :style="{ clipPath: `inset(0 calc(100% - ${pct}%) 0 0)` }" />
  <!-- handle -->
  <circle :cx="pct*trackW/100" :cy="mid" r="10" class="handle" />
</svg>
```

```ts
// wavePath：sin 波，相位用 rAF 推進製造流動感
function buildWavePath(width: number, amp = 3, wavelength = 40, phase = 0) {
  const pts: string[] = [`M 0 ${MID}`]
  const step = 2
  for (let x = 0; x <= width; x += step) {
    const y = MID + amp * Math.sin((x / wavelength) * Math.PI * 2 + phase)
    pts.push(`L ${x} ${y}`)
  }
  return pts.join(' ')
}
```

- amp 與 wavelength 為 token：`--md-sys-motion-wave-amplitude: 3px; --md-sys-motion-wave-wavelength: 40px;`
- value 在 0% / 100% 時 amp → 0（平滑收尾）
- 拖動中 phase 暫停推進，放開後恢復

---

## 5. 主題切換 (System / Light / Dark)

### 5.1 三段式切換

UI：`M3SegmentedButton` 三選項

- `desktop_windows` System
- `light_mode` Light
- `dark_mode` Dark

顯示文字（i18n）：

- `system` → 「系統 / System」
- `light` → 「淺色 / Light」
- `dark` → 「深色 / Dark」

選 System 時，旁邊顯示 effective mode：「系統 · 深色 / System · Dark」。

### 5.2 實作

```ts
// src/composables/useColorScheme.ts
import { useColorMode, usePreferredDark } from '@vueuse/core'

export function useColorScheme() {
  const mode = useColorMode({
    attribute: 'class',
    modes: { light: '', dark: 'dark' },
    storageKey: 'nocrop:color-scheme',
    emitAuto: true, // 允許 'auto' 值
    initialValue: 'auto',
  })
  const systemDark = usePreferredDark()
  const effective = computed(() =>
    mode.value === 'auto' ? (systemDark.value ? 'dark' : 'light') : mode.value,
  )
  return { mode, systemDark, effective }
}
```

### 5.3 M3 雙主題從同一 seed 生成

```ts
// src/theme/useM3Theme.ts
import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities'

export function applyTheme(seedHex: string) {
  const theme = themeFromSourceColor(argbFromHex(seedHex))
  const toCss = (scheme: any) =>
    Object.entries(scheme.toJSON())
      .map(([k, v]) => `--md-sys-color-${kebab(k)}: ${hexFromArgb(v as number)};`)
      .join('')
  const css = `
    :root { ${toCss(theme.schemes.light)} }
    .dark { ${toCss(theme.schemes.dark)} }
  `
  useStyleTag(css, { id: 'md-theme' }) // VueUse
}
```

- 初始化時 `applyTheme(BRAND_SEED)`
- 用戶點「以本圖配色」時 `applyTheme(extractedHex)`
- 切換 light/dark 只是切 `.dark` class，不重算 scheme

### 5.4 FOUC 防護

在 `index.html` `<head>` 最前面、所有 stylesheet 之前插入 blocking script：

```html
<script>
  ;(function () {
    try {
      var p = localStorage.getItem('nocrop:color-scheme')
      var dark =
        p === 'dark' || ((!p || p === 'auto') && matchMedia('(prefers-color-scheme: dark)').matches)
      var root = document.documentElement
      root.classList.toggle('dark', dark)
      // 第一個畫面禁過渡，避免 light→dark 閃動
      root.classList.add('no-transitions')
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.classList.remove('no-transitions')
        })
      })
    } catch (e) {}
  })()
</script>
```

CSS：

```css
.no-transitions * {
  transition: none !important;
}
```

### 5.5 顏色過渡

全域過渡（一般情況）：

```css
*,
*::before,
*::after {
  transition:
    background-color 200ms var(--md-sys-motion-easing-standard),
    color 200ms var(--md-sys-motion-easing-standard),
    border-color 200ms var(--md-sys-motion-easing-standard),
    fill 200ms var(--md-sys-motion-easing-standard),
    stroke 200ms var(--md-sys-motion-easing-standard);
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none;
  }
}
```

### 5.6 iOS Status Bar / Theme Color

`index.html`：

```html
<meta name="theme-color" content="#FFFBFE" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#1C1B1F" media="(prefers-color-scheme: dark)" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

且在主題切換 / reseed 時動態更新這些 meta 的 content。

### 5.7 Tailwind v4 整合

`src/styles/tailwind.css`：

```css
@import 'tailwindcss';

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-primary: var(--md-sys-color-primary);
  --color-on-primary: var(--md-sys-color-on-primary);
  --color-primary-container: var(--md-sys-color-primary-container);
  --color-on-primary-container: var(--md-sys-color-on-primary-container);
  --color-surface: var(--md-sys-color-surface);
  --color-on-surface: var(--md-sys-color-on-surface);
  /* … 其餘 M3 colors … */

  --radius-md-xs: var(--md-sys-shape-corner-extra-small);
  --radius-md-sm: var(--md-sys-shape-corner-small);
  --radius-md-md: var(--md-sys-shape-corner-medium);
  --radius-md-lg: var(--md-sys-shape-corner-large);
  --radius-md-xl: var(--md-sys-shape-corner-extra-large);
  --radius-md-full: var(--md-sys-shape-corner-full);
}
```

`@theme inline` 確保 `bg-primary` 等 utility 輸出的是 `var(--md-sys-color-primary)`，可隨 runtime 主題切換而變。

---

## 6. 國際化 (i18n)

### 6.1 語言

- **預設**：依 `navigator.languages` 偵測
- **支援**：`zh-TW` (繁體中文)、`en` (English)
- **fallback**：`en`

### 6.2 偵測邏輯

```ts
// src/i18n/detect.ts
const SUPPORTED = ['zh-TW', 'en'] as const

export function detectLocale(prefs: readonly string[]): (typeof SUPPORTED)[number] {
  for (const raw of prefs) {
    const tag = raw.toLowerCase()
    if (tag === 'zh-tw' || tag === 'zh-hant' || tag.startsWith('zh-hant-')) return 'zh-TW'
    if (tag === 'zh' || tag.startsWith('zh-')) return 'zh-TW' // 將 zh 視為繁中（本 App 只有繁中）
    if (tag === 'en' || tag.startsWith('en-')) return 'en'
  }
  return 'en'
}
```

啟動時：

```ts
const stored = localStorage.getItem('nocrop:locale')
const locale = stored || detectLocale(navigator.languages)
```

切換語言時：

1. `i18n.global.locale.value = locale`
2. `document.documentElement.lang = locale`
3. `localStorage.setItem('nocrop:locale', locale)`

### 6.3 檔案結構

```
src/
  i18n/
    index.ts            # createI18n
    detect.ts           # detectLocale()
    schema.d.ts         # 型別擴充 (module augmentation)
  locales/
    en.json
    zh-TW.json
```

### 6.4 設定

```ts
// src/i18n/index.ts
import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'en', // 啟動後由 main.ts 覆寫
  fallbackLocale: 'en',
  messages: { en }, // zh-TW 動態載入
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
})

export async function loadLocale(locale: 'en' | 'zh-TW') {
  if (i18n.global.availableLocales.includes(locale)) return
  const msgs = await import(`../locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, msgs.default)
}
```

### 6.5 型別安全 (Module Augmentation)

```ts
// src/i18n/schema.d.ts
import type enMessages from '../locales/en.json'

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends typeof enMessages {}
}
```

`tsconfig.json` 必須 include 此檔。`t('header.title')` 即有 autocomplete + 編譯期檢查。

### 6.6 Translation Key 命名規約

```
{namespace}.{section}.{key}

範例:
  app.name
  app.tagline
  app.privacy.notice

  action.download
  action.share
  action.reset
  action.compare
  action.paste

  upload.dropzone.title
  upload.dropzone.hint
  upload.button.choose

  ratio.label
  ratio.preset.square
  ratio.preset.portrait_4_5
  ratio.preset.story_9_16
  ratio.preset.landscape_16_9
  ratio.preset.linkcard_191_1
  ratio.preset.tall_3_4
  ratio.preset.pin_2_3
  ratio.custom

  fill.mode.solid
  fill.mode.blur
  fill.solid.colorpicker
  fill.solid.from_image
  fill.solid.rethemeButton
  fill.blur.intensity

  scale.label
  scale.unit

  export.format.png
  export.format.jpeg
  export.quality
  export.filename
  export.full_preview

  theme.system
  theme.light
  theme.dark
  theme.system_effective

  locale.zh_tw
  locale.en

  error.image_too_large
  error.heic_decode_failed
  error.canvas_unavailable
  error.unsupported_format
```

### 6.7 Vite Plugin

```ts
// vite.config.ts (片段)
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  plugins: [
    vue(),
    VueI18nPlugin({
      include: [path.resolve(__dirname, './src/locales/**')],
      strictMessage: true,
      runtimeOnly: true, // 訊息預編譯，runtime 不需要 compiler
    }),
  ],
})
```

---

## 7. 功能規格

### 7.1 圖片輸入

#### 7.1.1 來源

| 來源                    | 實作                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| 點擊選擇                | `<input type="file" accept="image/*,.heic,.heif">` + VueUse `useFileDialog`           |
| 拖放                    | VueUse `useDropZone` 包整個 editor 區                                                 |
| 貼上 (桌面 / iPad 鍵盤) | 自製 `useImagePaste`：window `paste` event → `clipboardData.items` 篩 `kind==='file'` |
| 貼上 (iPhone)           | 顯示「貼上」按鈕，點擊呼叫 `navigator.clipboard.read()`（需用戶手勢）                 |
| 拍攝                    | iPhone 上 file input 自動提供「拍照」選項；不額外加 `capture` 屬性以保留「相簿」選項  |

#### 7.1.2 HEIC 處理

```ts
// src/composables/useImageLoader.ts (片段)
async function loadFile(file: File): Promise<ImageBitmap> {
  const isHeic =
    /\.(heic|heif)$/i.test(file.name) || ['image/heic', 'image/heif'].includes(file.type)
  let blob: Blob = file
  if (isHeic) {
    const { default: heic2any } = await import('heic2any') // lazy
    blob = (await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    })) as Blob
  }
  return createImageBitmap(blob)
}
```

#### 7.1.3 Downscale 保護

```ts
const MAX_LONG_EDGE = 4096
async function ensureSafeSize(bmp: ImageBitmap): Promise<ImageBitmap> {
  const long = Math.max(bmp.width, bmp.height)
  if (long <= MAX_LONG_EDGE) return bmp
  const k = MAX_LONG_EDGE / long
  return createImageBitmap(bmp, {
    resizeWidth: Math.round(bmp.width * k),
    resizeHeight: Math.round(bmp.height * k),
    resizeQuality: 'high',
  })
}
```

### 7.2 比例選擇 (Aspect Ratio)

#### 7.2.1 預設清單

```ts
// src/config/ratios.ts
export const RATIO_PRESETS = [
  { id: 'square', ratio: [1, 1], label: 'ratio.preset.square' },
  { id: 'portrait_4_5', ratio: [4, 5], label: 'ratio.preset.portrait_4_5' },
  { id: 'story_9_16', ratio: [9, 16], label: 'ratio.preset.story_9_16' },
  {
    id: 'landscape_16_9',
    ratio: [16, 9],
    label: 'ratio.preset.landscape_16_9',
  },
  {
    id: 'linkcard_191_1',
    ratio: [191, 100],
    label: 'ratio.preset.linkcard_191_1',
  },
  { id: 'tall_3_4', ratio: [3, 4], label: 'ratio.preset.tall_3_4' },
  { id: 'pin_2_3', ratio: [2, 3], label: 'ratio.preset.pin_2_3' },
] as const
```

#### 7.2.2 UI

- 橫向捲動的 Chip group（行動）或固定 grid（桌面）
- 每個 chip 顯示比例 icon (mini 矩形) + 名稱
- 第 8 個 chip：「自訂 / Custom」→ 開啟 dialog 輸入 W × H
- 預設選擇：**1:1**

### 7.3 填充模式

#### 7.3.1 模式切換

`M3SegmentedButton` 兩段：

- 「純色 / Solid」
- 「模糊 / Blur」

#### 7.3.2 純色填充

- HCT 色相 + 明度 / 彩度 滑桿（`M3ColorPicker`）
- **從圖片抽出色** swatches（5–8 顆 chip，水平捲動）
  - 圖片載入後 worker 跑 `colorthief`
  - 每個 swatch 顯示色 + 名稱 (可選)
  - 點選 swatch → 設為背景色
  - 右側「以本圖配色 / Re-theme」按鈕：用該圖主色 reseed app 主題
- 最近使用色（local storage 存 5 個）

#### 7.3.3 模糊填充

- 強度 `M3Slider` 0–100，預設 60
- Slider 即時更新預覽（160ms debounce）
- 拖動時 phase 凍結，放開恢復波紋流動

### 7.4 前景縮放

- `M3Slider` 50%–100%，預設 100%
- 100% = 圖片在 frame 內 contain 後最大化
- 50% = 縮到 contain 尺寸的 50%

### 7.5 輸出

#### 7.5.1 格式選擇

- PNG (無損)
- JPEG (品質 60–100，預設 92)
- ~~WebP~~ (Safari toBlob 不支援，v1 不提供)

#### 7.5.2 檔名規則

```
nocrop_{originalBaseName}_{ratioId}_{YYYYMMDD-HHmmss}.{ext}
```

範例：`nocrop_IMG_1234_square_20260606-143012.png`

#### 7.5.3 下載 / 分享

```ts
// 桌面 + Android Chrome
const a = Object.assign(document.createElement('a'), {
  href: URL.createObjectURL(blob),
  download: filename,
})
a.click()
URL.revokeObjectURL(a.href)

// iOS Safari：優先 Web Share API
if (
  navigator.canShare?.({
    files: [new File([blob], filename, { type: blob.type })],
  })
) {
  await navigator.share({
    files: [new File([blob], filename, { type: blob.type })],
  })
} else {
  // fallback：在新分頁開啟，提示用戶長按存圖
}
```

### 7.6 工具列輔助操作

| 按鈕                             | 行為                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| **Reset / 重設**                 | 清除所有編輯參數，回到匯入後預設狀態（保留圖片）                                     |
| **Compare / 對照原圖**           | **長按**顯示原圖（不含任何處理），放開回到處理後預覽。配合 `motion-v` opacity spring |
| **Full-size Preview / 真實預覽** | 開啟 modal，以匯出尺寸渲染（限大圖較耗時，顯示 loading）                             |
| **Change Image / 換圖**          | 重新選擇圖片                                                                         |
| **Download / 下載**              | FAB，主操作                                                                          |

### 7.7 隱私聲明

頂端永久顯示 chip：

- zh-TW：「圖片不離開您的裝置」
- en：「Images never leave your device」

附 `info` icon，點擊開啟簡短 dialog 說明所有處理都在本地。

### 7.8 設定面板

`M3BottomSheet` (行動) / 側邊 `M3Card` (桌面)：

- 主題：System / Light / Dark
- 語言：zh-TW / en
- 「以本圖配色」按鈕（若有圖）
- 預設輸出格式
- App 版本

### 7.9 錯誤處理

| 情境                 | UX                                   |
| -------------------- | ------------------------------------ |
| 圖片解碼失敗         | `M3Snackbar` 紅色，提示重試 / 換檔案 |
| HEIC 解碼失敗        | 同上，提示「請改用 JPEG/PNG」        |
| Canvas 超過 iOS 上限 | 自動降階重試一次；仍失敗 → snackbar  |
| Clipboard 無圖       | Snackbar：「剪貼簿內沒有圖片」       |
| 不支援的格式         | Snackbar 列出支援列表                |
| Web Share 取消       | 靜默                                 |

### 7.10 鍵盤快捷鍵 (桌面)

| 快捷鍵         | 行為            |
| -------------- | --------------- |
| `Cmd/Ctrl + V` | 貼上圖片        |
| `Cmd/Ctrl + O` | 開啟檔案選擇    |
| `Cmd/Ctrl + S` | 下載            |
| `R`            | Reset           |
| `C` (hold)     | Compare         |
| `1`–`7`        | 切換比例 preset |
| `?`            | 顯示快捷鍵列表  |

---

## 8. 檔案結構與 Composables

### 8.1 專案結構

```
no-crop-ai/
├── public/
│   ├── icons/                  # PWA icons (manifest 引用)
│   ├── apple-touch-icon.png    # 180×180
│   └── apple-splash/           # iOS startup images (自動產生)
├── src/
│   ├── assets/
│   │   └── fonts/              # Roboto Flex / Noto Sans TC / Material Symbols (自帶 woff2)
│   ├── components/
│   │   ├── AppShell.vue
│   │   ├── TopAppBar.vue
│   │   ├── PrivacyChip.vue
│   │   ├── ImageDropzone.vue
│   │   ├── EditorCanvas.vue           # 預覽 canvas
│   │   ├── ControlsPanel.vue          # 行動 bottom sheet / 桌面側欄
│   │   ├── RatioSelector.vue
│   │   ├── FillModeTabs.vue
│   │   ├── SolidFillControls.vue
│   │   ├── BlurFillControls.vue
│   │   ├── ScaleControl.vue
│   │   ├── ColorSwatches.vue          # 抽出的圖片主題色
│   │   ├── ExportDialog.vue
│   │   ├── FullSizePreviewDialog.vue
│   │   ├── SettingsSheet.vue
│   │   ├── CompareOverlay.vue
│   │   └── ui/                        # 自製 M3 元件 (見 4.8)
│   │       ├── M3Button.vue
│   │       ├── M3IconButton.vue
│   │       ├── M3FAB.vue
│   │       ├── M3Card.vue
│   │       ├── M3Slider.vue           # wavy track
│   │       ├── M3Switch.vue
│   │       ├── M3SegmentedButton.vue
│   │       ├── M3Chip.vue
│   │       ├── M3Dialog.vue
│   │       ├── M3BottomSheet.vue
│   │       ├── M3Snackbar.vue
│   │       ├── M3TopAppBar.vue
│   │       ├── M3ColorPicker.vue
│   │       ├── M3LoadingIndicator.vue
│   │       ├── M3Icon.vue
│   │       └── ShapeMorph.vue
│   ├── composables/
│   │   ├── useImageLoader.ts          # 解碼 + HEIC + downscale
│   │   ├── useImagePaste.ts           # paste event 與 Clipboard API
│   │   ├── useColorExtraction.ts      # ColorThief worker wrapper
│   │   ├── useRenderer.ts             # 預覽 + 匯出，呼叫 renderFrame
│   │   ├── useDownload.ts             # toBlob → download / share
│   │   ├── useColorScheme.ts          # System/Light/Dark
│   │   ├── useM3Theme.ts              # MCU seed → CSS vars
│   │   ├── useLocale.ts               # vue-i18n 包裝
│   │   ├── useAspectRatio.ts          # 比例計算 + 內建 preset 邏輯
│   │   ├── useKeyboardShortcuts.ts
│   │   └── usePwaUpdate.ts            # vite-plugin-pwa registerSW
│   ├── render/
│   │   ├── renderFrame.ts             # 核心純函式 (見 3.2)
│   │   ├── layout.ts                  # contain / cover 計算
│   │   ├── stackBlur.ts               # 包 stackblur-canvas，統一介面
│   │   ├── previewSize.ts
│   │   └── exportSize.ts
│   ├── workers/
│   │   ├── render.worker.ts           # OffscreenCanvas → renderFrame
│   │   └── colorExtractor.worker.ts   # ColorThief in worker
│   ├── theme/
│   │   ├── seed.ts                    # 品牌 seed 常數
│   │   ├── motion.ts                  # m3Springs
│   │   ├── tokens.css                 # 靜態 token (shape / motion / state / typescale)
│   │   └── applyTheme.ts              # MCU → CSS vars 注入
│   ├── stores/
│   │   ├── editorStore.ts             # source / frame / fill / scale
│   │   ├── settingsStore.ts           # theme / locale / defaults
│   │   └── historyStore.ts            # 最近使用色 (v1.1)
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── detect.ts
│   │   └── schema.d.ts
│   ├── locales/
│   │   ├── en.json
│   │   └── zh-TW.json
│   ├── config/
│   │   ├── ratios.ts
│   │   └── constants.ts               # MAX_LONG_EDGE 等
│   ├── styles/
│   │   ├── tailwind.css               # @import + @theme inline + @custom-variant
│   │   ├── tokens.css                 # 靜態 CSS variables
│   │   └── base.css                   # reset / global / 過渡
│   ├── utils/
│   │   ├── kebab.ts
│   │   ├── formatFilename.ts
│   │   ├── debounce.ts                # 或從 vueuse
│   │   └── canvasLimits.ts
│   ├── types/
│   │   └── render.ts
│   ├── App.vue
│   ├── main.ts
│   └── registerSW.ts
├── index.html                          # FOUC script + iOS meta
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts                  # v4 多用 CSS，最少配置
├── package.json
├── README.md
└── SPEC.md                             # 本文件
```

### 8.2 Composable API 摘要

```ts
// useImageLoader.ts
function useImageLoader(): {
  load(file: File | Blob): Promise<ImageBitmap>
  loading: Ref<boolean>
  error: Ref<Error | null>
}

// useImagePaste.ts
function useImagePaste(onImage: (file: File) => void): {
  pasteFromButton(): Promise<void> // iPhone 用
  isPermissionDenied: Ref<boolean>
}

// useRenderer.ts
function useRenderer(targetCanvas: Ref<HTMLCanvasElement | null>): {
  renderPreview(): void // debounced
  renderExport(): Promise<Blob>
  isRendering: Ref<boolean>
}

// useColorScheme.ts
function useColorScheme(): {
  mode: Ref<'auto' | 'light' | 'dark'>
  effective: ComputedRef<'light' | 'dark'>
  systemDark: Ref<boolean>
}

// useM3Theme.ts
function useM3Theme(): {
  seed: Ref<string>
  setSeed(hex: string): void // re-generate light+dark + inject CSS
  resetToBrand(): void
}

// useLocale.ts
function useLocale(): {
  locale: WritableComputedRef<'zh-TW' | 'en'>
  available: readonly ('zh-TW' | 'en')[]
  setLocale(l: 'zh-TW' | 'en'): Promise<void>
}

// useAspectRatio.ts
function useAspectRatio(): {
  preset: Ref<RatioPresetId>
  custom: Ref<{ w: number; h: number } | null>
  ratio: ComputedRef<[number, number]>
}
```

### 8.3 Store 結構

```ts
// editorStore.ts
state: {
  source: ImageBitmap | null
  sourceFilename: string | null
  fill:
    | { mode: 'solid'; color: string }
    | { mode: 'blur'; intensity: number }
  foregroundScale: number             // 0.5–1.0
  ratio: [number, number]
  extractedColors: string[]           // ColorThief 結果
}
actions: {
  setSource(bmp: ImageBitmap, name: string): void
  setFill(fill: ...): void
  setScale(s: number): void
  setRatio(r: [number, number]): void
  reset(): void
}

// settingsStore.ts
state: {
  colorMode: 'auto' | 'light' | 'dark'
  locale: 'zh-TW' | 'en'
  defaultFormat: 'png' | 'jpeg'
  defaultJpegQuality: number
}
```

---

## 9. PWA 設定

### 9.1 vite-plugin-pwa 設定

```ts
// vite.config.ts (片段)
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  injectRegister: false, // 手動在 main.ts 註冊以便 UI 提示
  devOptions: { enabled: true },
  manifest: {
    name: 'No Crop',
    short_name: 'NoCrop',
    description: 'Resize images to any ratio without cropping.',
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
    runtimeCaching: [
      // Material Symbols / Roboto Flex 自帶於 /assets/fonts/，由 precache 處理
      // 若改成 Google Fonts CDN：
      // {
      //   urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
      //   handler: 'CacheFirst',
      //   options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60*60*24*365 } }
      // }
    ],
  },
})
```

### 9.2 註冊 + 更新提示

```ts
// src/composables/usePwaUpdate.ts
import { useRegisterSW } from 'virtual:pwa-register/vue'

export function usePwaUpdate() {
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW: (swUrl, r) => {
      /* log */
    },
    onRegisterError: (e) => console.error('SW register error', e),
  })
  return { needRefresh, offlineReady, updateServiceWorker }
}
```

UI 元件 `ReloadPrompt.vue` (在 `AppShell.vue` 內掛載)：

- `needRefresh === true` → 顯示 snackbar「有新版本可用」+「更新」按鈕
- `offlineReady === true` → snackbar「已可離線使用」

### 9.3 iOS PWA Meta Tags

`index.html`：

```html
<!-- 基本 -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
/>
<meta name="theme-color" content="#FFFBFE" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#1C1B1F" media="(prefers-color-scheme: dark)" />

<!-- iOS PWA -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="No Crop" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<!-- iOS Splash (由 @vite-pwa/assets-generator 產生多版本) -->
<!-- 範例: -->
<link
  rel="apple-touch-startup-image"
  media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
  href="/apple-splash/iphone-15-pro-portrait.png"
/>
<!-- ...18+ 個版本由 generator 自動補齊 ... -->
```

### 9.4 Assets Generator

```jsonc
// package.json scripts
{
  "generate-pwa-assets": "pwa-assets-generator --preset minimal-2023 public/icons/source.svg",
}
```

需要一個高解析度 SVG 作為 source（v1 先用 placeholder：圓角方形 + 中央裁切符號）。

### 9.5 安全區與 100dvh

```css
.app-shell {
  min-height: 100dvh;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

## 10. iOS / Safari 相容性檢查表

| 項目                                          | 處理                                                            |
| --------------------------------------------- | --------------------------------------------------------------- |
| ❗ Canvas area > 16,777,216 px² (4096²)       | `ensureSafeSize()` downscale + `getExportPx()` 上限保護         |
| ❗ `CanvasRenderingContext2D.filter` 不支援   | 改用 `stackblur-canvas`（架構強制）                             |
| ❗ WebP `toBlob` 不支援                       | 只提供 PNG / JPEG                                               |
| ❗ HEIC 無原生解碼                            | `heic2any` lazy load                                            |
| ❗ `<a download>` 部分支援                    | iOS 改用 Web Share API                                          |
| `100vh` 隨地址列縮放                          | 用 `100dvh`                                                     |
| 沒有 hover                                    | 所有狀態以 active / focus / pressed 為主                        |
| 觸控 vs 滑鼠                                  | 用 Pointer Events，`touch-action: none` 於 canvas               |
| 鎖定縮放（防 pinch zoom 進畫布）              | `maximum-scale=1` viewport                                      |
| iOS clipboard permission                      | 顯示「貼上」按鈕，於用戶手勢內呼叫                              |
| `<input type="file">` HEIC 時 `type` 可能為空 | 用副檔名 fallback                                               |
| OffscreenCanvas (iOS Safari <16.4 沒有)       | 偵測後 fallback main thread                                     |
| Memory pressure / tab kill                    | 嚴格 downscale + 不持有多份 ImageBitmap + `URL.revokeObjectURL` |
| Safe area                                     | `env(safe-area-inset-*)`                                        |
| Status bar 配色                               | `theme-color` meta + `apple-mobile-web-app-status-bar-style`    |

---

## 11. 效能與無障礙

### 11.1 效能

- 預覽渲染 debounce 160ms（slider 拖動）；放開 trailing edge 立即渲染一次
- 預覽 canvas backing store 封頂 1024 (mobile) / 1280 (desktop)
- ColorThief 與 render 都走 Web Worker
- `heic2any` 與 `flubber` lazy import
- Material Symbols / Roboto Flex 自帶 subset woff2，`font-display: swap`
- 圖片初始化即 downscale 到 ≤4096 長邊
- Pinia store 不放可變 reactive 的 ImageBitmap（用 `markRaw`）
- `URL.createObjectURL` 用後 `revoke`
- Vite `build.target: 'es2022'`，現代瀏覽器體積最小

### 11.2 無障礙 (WCAG 2.2 AA)

- 所有互動元件可 Tab 聚焦，focus ring 用 M3 token (`outline: 2px solid var(--md-sys-color-primary)`)
- Slider 提供 `aria-valuemin/max/now/text`，方向鍵調整
- Color picker 提供 hex / HSL 文字輸入 fallback
- 對比度由 MCU `themeFromSourceColor` 內建保證（M3 token 對 on-color 配對）
- 所有圖示按鈕有 `aria-label` (i18n)
- 拖放區域可用鍵盤啟動檔案選擇
- `prefers-reduced-motion: reduce` → 關閉 spring / 顏色過渡 / wavy 波紋動畫
- `prefers-contrast: more` → 提升 outline 寬度，加深 border 對比
- 語意 HTML：`<button>`、`<input>`、`<dialog>`，避免無語意 `<div>` 取代
- 螢幕閱讀器：keyboard shortcuts 列表、隱私說明 dialog 可由 SR 朗讀

---

## 12. Roadmap

### v1.1

- 漸層填充（從圖片抽兩色生成）
- 「重置 / 預設」操作的多層 undo / redo
- 最近使用色記憶
- 100% 像素檢視放大鏡（WYSIWYG 二次保險）

### v1.2

- 多圖批次處理
- 自訂預設組合（記住「比例 + 填充模式 + 縮放」）
- 匯出時內嵌簡易 EXIF（保留原圖拍攝資訊）

### v1.3

- 雲端剪貼簿（Web Share Target API）—iOS 不支援但 Android 可
- AI 智慧構圖建議（純前端 ONNX 模型，可選）
- 更多語言（日 / 韓 / 簡中）

### v2.0

- 簡易圖層 / 文字疊加
- 模板系統（IG 限動模板等）

---

## 13. Glossary / 名詞表

| 術語                         | 解釋                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| **WYSIWYG**                  | What You See Is What You Get — 預覽即匯出                  |
| **HCT**                      | Hue, Chroma, Tone — Material 3 採用的色彩空間              |
| **MCU**                      | `@material/material-color-utilities`                       |
| **Frame**                    | App 內對「目標輸出畫布」的抽象，含 `ratio` 與 `exportPx`   |
| **Source**                   | 原圖（解碼且 iOS-safe downscale 後的 `ImageBitmap`）       |
| **Contain**                  | 不裁切，整張圖縮到 frame 內，多餘為填充區（本 App 主功能） |
| **Cover**                    | 裁切，圖鋪滿 frame（本 App 僅模糊背景使用）                |
| **DPR**                      | `window.devicePixelRatio`                                  |
| **FOUC**                     | Flash of Unstyled Content — 載入初瞬間樣式未套用的閃動     |
| **PWA**                      | Progressive Web App                                        |
| **OffscreenCanvas**          | 可在 Web Worker 內使用的 canvas，避免主執行緒卡頓          |
| **StackBlur**                | 一種高效的 Gaussian-approx 模糊演算法                      |
| **Hero moment**              | M3 Expressive 中每螢幕 1–2 處的視覺焦點互動                |
| **Spring (spatial/effects)** | M3 動效兩大類：位置/大小用 spatial、顏色/透明度用 effects  |

---

## 附錄 A：開發流程建議順序

1. **建專案骨架** — Vite + Vue + TS + Tailwind v4
2. **設計 token 系統** — `tokens.css` + `applyTheme.ts` + 一個寫死 seed 跑通
3. **主題切換 + i18n** — 兩個基礎設施先到位
4. **`renderFrame()` 純函式** — 先在 unit test 中跑通（給定 ImageBitmap 與 params，產出 canvas 圖）
5. **EditorCanvas + 預覽 worker** — 用 mock 圖跑通管線
6. **`M3Slider` (wavy)** — 第一個自製元件，含動畫
7. **其餘 UI 元件** — Button / Card / Dialog / ColorPicker
8. **檔案輸入 + HEIC** — 拖放、點選、貼上
9. **比例選擇 + 填充控制**
10. **匯出（含 iOS Web Share）**
11. **PWA 設定 + iOS splash**
12. **WYSIWYG 測試清單跑過** (3.9)
13. **無障礙 + 效能審查**
14. **Roadmap v1.1 開規劃**

---

## 附錄 B：關鍵架構決策記錄 (ADR)

| #   | 決策                                      | 替代方案                         | 選擇理由                                             |
| --- | ----------------------------------------- | -------------------------------- | ---------------------------------------------------- |
| 1   | 預覽與匯出共用單一 `renderFrame()` 純函式 | 預覽用 CSS filter，匯出用 canvas | WYSIWYG 一致性 + Safari 無 `ctx.filter`              |
| 2   | StackBlur 取代 `ctx.filter`               | CSS filter + html2canvas         | Safari 不支援 `ctx.filter`，html2canvas 過重且有色差 |
| 3   | App 主題用品牌 seed，不跟隨圖片           | 每張圖自動 reseed UI             | 避免每次匯入跳色干擾用戶                             |
| 4   | 自製 M3 元件，不用 Vuetify                | Vuetify 4 (M3 已支援)            | Vuetify 尚未 Expressive；自製可貼近 M3 2025 規格     |
| 5   | OffscreenCanvas worker + main fallback    | 強制 worker / 強制 main          | iOS Safari <16.4 沒 OffscreenCanvas                  |
| 6   | Tailwind v4 + `@theme inline` 串 CSS vars | Tailwind v3 + JS 主題            | v4 inline CSS var 完美承接 runtime 主題切換          |
| 7   | `useColorMode` 三段 (auto/light/dark)     | 兩段 toggle                      | 用戶可選跟隨系統，符合 OS-level 期待                 |
| 8   | 雙語 i18n 仍 lazy load 結構               | 兩語都 eager                     | 未來新增語言不用重構                                 |
| 9   | 預覽 cap 1024/1280                        | 動態跟匯出尺寸                   | slider 拖動效能保護                                  |
| 10  | 匯出長邊 = 原圖長邊（不放大）             | 固定 1080 / 1920                 | 不犧牲原圖細節，符合 user mental model               |
