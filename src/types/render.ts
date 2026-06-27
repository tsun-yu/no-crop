/**
 * Render pipeline type definitions.
 *
 * These types are the contract between:
 *   - Pinia editorStore (which holds the user's editing state)
 *   - renderFrame() (the single pure function from SPEC §3)
 *   - Worker boundary (params must be serializable / Transferable-safe)
 *
 * IMPORTANT: keep these resolution-independent (SPEC §3.2 invariant I3).
 * No pixel sizes here besides `outputPx` itself.
 */

/** RGB(A) hex like `#RRGGBB` or `#RRGGBBAA`. */
export type HexColor = string

/** Aspect ratio expressed as integer tuple to avoid float drift. */
export type AspectRatio = readonly [number, number]

/** Fill mode union. Strictly one of solid or blur. */
export type FillParams =
  | { readonly mode: 'solid'; readonly color: HexColor }
  | { readonly mode: 'blur'; readonly intensity: number /* 0–100 */ }

/** Source bitmap. Either a real ImageBitmap (browser) or an HTMLImageElement. */
export type RenderSource = ImageBitmap | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas

/** Backing-store size in physical pixels. */
export type OutputPx = { readonly w: number; readonly h: number }

/** Full set of params for a single render call. */
export interface RenderParams {
  /** Decoded, iOS-safe source bitmap. Same instance shared by preview and export (SPEC I4). */
  readonly source: RenderSource
  /** Target frame aspect ratio. */
  readonly ratio: AspectRatio
  /** Background fill (solid color or blurred source). */
  readonly fill: FillParams
  /** Foreground scale, 0.5–1.0 (1 = fit-contain at max size). */
  readonly foregroundScale: number
}

/** Discriminated subset used by the worker boundary. ImageBitmap is Transferable. */
export interface WorkerRenderRequest {
  readonly source: ImageBitmap
  readonly ratio: AspectRatio
  readonly fill: FillParams
  readonly foregroundScale: number
  readonly outputPx: OutputPx
}

/** Result returned from the worker — a Transferable ImageBitmap ready to drawImage. */
export interface WorkerRenderResult {
  readonly bitmap: ImageBitmap
  readonly outputPx: OutputPx
}

/**
 * Minimal 2D context surface used by the render pipeline.
 *
 * Defined structurally (NOT as `CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D`)
 * so:
 *   1. Both real contexts satisfy it (structural supersets).
 *   2. Test mocks can implement just this subset — TS forbids extending a
 *      union, but this is a plain interface so `MockContext extends
 *      AnyCanvasContext2D` works.
 *
 * Add to this interface only when renderFrame() / stackBlur grow a new
 * dependency on the 2D context API.
 */
export interface AnyCanvasContext2D {
  imageSmoothingEnabled: boolean
  imageSmoothingQuality: ImageSmoothingQuality
  fillStyle: string | CanvasGradient | CanvasPattern
  clearRect(x: number, y: number, w: number, h: number): void
  fillRect(x: number, y: number, w: number, h: number): void
  drawImage(image: CanvasImageSource, dx: number, dy: number): void
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
  drawImage(
    image: CanvasImageSource,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData
  putImageData(imagedata: ImageData, dx: number, dy: number): void
}
