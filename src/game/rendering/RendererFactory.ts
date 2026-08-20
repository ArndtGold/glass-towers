import type { Camera, Scene } from 'three'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { GAME_CONFIG } from '../config'
import type { RendererBackend, RendererFailure, RendererStatus } from '../types'
import type { RendererTestMode } from '../testing/rendererStrategy'

export type GlassRenderer = WebGPURenderer

export interface RendererSession {
  renderer: GlassRenderer
  status: RendererStatus
  dispose: () => void
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId = 0
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

const backendOf = (renderer: GlassRenderer): RendererBackend => {
  const backend = renderer.backend as unknown as { isWebGLBackend?: boolean }
  return backend.isWebGLBackend ? 'webgl2' : 'webgpu'
}

async function createAttempt(
  canvas: HTMLCanvasElement,
  scene: Scene,
  camera: Camera,
  forceWebGL: boolean,
): Promise<RendererSession> {
  const renderer = new WebGPURenderer({ canvas, antialias: true, forceWebGL })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  try {
    await withTimeout(renderer.init(), GAME_CONFIG.rendererPresentationTimeoutMs, 'Renderer initialization')
    const backend = backendOf(renderer)
    const pixelRatioLimit = backend === 'webgpu' ? GAME_CONFIG.maxPixelRatioWebGpu : GAME_CONFIG.maxPixelRatioWebGl2
    renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, pixelRatioLimit))
    renderer.setSize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight), false)
    await withTimeout(
      (async () => {
        renderer.render(scene, camera)
        await nextFrame()
        renderer.render(scene, camera)
        await nextFrame()
      })(),
      GAME_CONFIG.rendererStableFrameTimeoutMs,
      'Stable presentation',
    )
    return {
      renderer,
      status: { backend, qualityTier: backend === 'webgpu' ? 'high' : 'compatible' },
      dispose: () => renderer.dispose(),
    }
  } catch (error) {
    renderer.dispose()
    throw error
  }
}

export async function createRendererSession(
  canvas: HTMLCanvasElement,
  scene: Scene,
  camera: Camera,
  mode: RendererTestMode,
): Promise<RendererSession> {
  if (mode === 'fail-all') {
    const failure: RendererFailure = {
      kind: 'renderer-unavailable',
      message: 'Neither WebGPU nor WebGL2 could start in this browser.',
      attempts: [
        { mode: 'auto', reason: 'Forced test failure' },
        { mode: 'forced-webgl2', reason: 'Forced test failure' },
      ],
    }
    throw failure
  }

  if (mode === 'force-webgl2') return createAttempt(canvas, scene, camera, true)

  const attempts: RendererFailure['attempts'] = []
  try {
    return await createAttempt(canvas, scene, camera, false)
  } catch (error) {
    attempts.push({ mode: 'auto', reason: error instanceof Error ? error.message : String(error) })
  }

  try {
    return await createAttempt(canvas, scene, camera, true)
  } catch (error) {
    attempts.push({ mode: 'forced-webgl2', reason: error instanceof Error ? error.message : String(error) })
  }

  const failure: RendererFailure = {
    kind: 'renderer-unavailable',
    message: 'Glass Towers could not initialize WebGPU or its WebGL2 fallback.',
    attempts,
  }
  throw failure
}

export function isRendererFailure(value: unknown): value is RendererFailure {
  return Boolean(value && typeof value === 'object' && (value as RendererFailure).kind === 'renderer-unavailable')
}
