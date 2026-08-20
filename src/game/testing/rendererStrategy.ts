export type RendererTestMode = 'auto' | 'force-webgl2' | 'fail-all'

export function resolveRendererTestMode(url = globalThis.location?.href ?? ''): RendererTestMode {
  if (!import.meta.env.DEV) return 'auto'
  const mode = new URL(url, 'http://localhost').searchParams.get('renderer')
  if (mode === 'webgl2') return 'force-webgl2'
  if (mode === 'fail') return 'fail-all'
  return 'auto'
}
