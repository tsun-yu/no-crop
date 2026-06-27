/**
 * Small helpers used by the Download button flow.
 *
 * downloadBlob — kicks off a save-dialog (or silent download) via an anchor.
 * suggestFilename — produces a sane filename from original + ratio + ext.
 */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Browsers eventually GC the URL, but freeing it sooner avoids leaks.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function suggestFilename(
  source: string | null | undefined,
  ratio: readonly [number, number],
  ext: 'png' | 'jpg',
): string {
  const raw = (source ?? 'no-crop').replace(/\.[^.]+$/, '')
  const safeBase =
    raw
      .replace(/[^\w-]+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 60) || 'no-crop'
  return `${safeBase}_${ratio[0]}x${ratio[1]}.${ext}`
}
