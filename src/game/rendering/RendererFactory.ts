import type { Camera, Scene, ToneMapping } from 'three'
import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { GAME_CONFIG } from '../config'
import type { RendererBackend, RendererFailure, RendererStatus } from '../types'
import type { RendererTestMode } from '../testing/rendererStrategy'

export interface GlassRenderer {
  outputColorSpace: string
  toneMapping: ToneMapping
  toneMappingExposure: number
  setPixelRatio: (value: number) => void
  setSize: (width: number, height: number, updateStyle?: boolean) => void
  render: (scene: Scene, camera: Camera) => void
  dispose: () => void
}

export interface RendererAdapter {
  backend: RendererBackend
  create: (canvas: HTMLCanvasElement) => GlassRenderer
  initialize: (renderer: GlassRenderer) => Promise<void>
}

export interface RendererDependencies {
  hasWebGpu: () => boolean | Promise<boolean>
  webGpu: RendererAdapter
  webGl2: RendererAdapter
  nextFrame: () => Promise<void>
}

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

const browserDependencies: RendererDependencies = {
  hasWebGpu: async () => {
    const gpu = (typeof navigator === 'undefined' ? undefined : navigator.gpu) as
      | { requestAdapter: () => Promise<unknown> }
      | undefined
    if (!gpu) return false
    try {
      return Boolean(await gpu.requestAdapter())
    } catch {
      return false
    }
  },
  webGpu: {
    backend: 'webgpu',
    create: (canvas) => new WebGPURenderer({ canvas, antialias: true }),
    initialize: async (renderer) => {
      await (renderer as WebGPURenderer).init()
    },
  },
  webGl2: {
    backend: 'webgl2',
    create: (canvas) => {
      const context = canvas.getContext('webgl2')
      if (!context) throw new Error('WebGL2 context is unavailable')
      return new WebGLRenderer({ canvas, context })
    },
    initialize: async () => undefined,
  },
  nextFrame: () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
}

async function createAttempt(
  canvas: HTMLCanvasElement,
  scene: Scene,
  camera: Camera,
  adapter: RendererAdapter,
  nextFrame: () => Promise<void>,
): Promise<RendererSession> {
  const renderer = adapter.create(canvas)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08

  try {
    await withTimeout(adapter.initialize(renderer), GAME_CONFIG.rendererPresentationTimeoutMs, 'Renderer initialization')
    const backend = adapter.backend
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
  dependencies: RendererDependencies = browserDependencies,
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

  if (mode === 'force-webgl2') {
    try {
      return await createAttempt(canvas, scene, camera, dependencies.webGl2, dependencies.nextFrame)
    } catch (error) {
      const failure: RendererFailure = {
        kind: 'renderer-unavailable',
        message: 'Glass Towers could not initialize its WebGL2 fallback.',
        attempts: [{ mode: 'forced-webgl2', reason: error instanceof Error ? error.message : String(error) }],
      }
      throw failure
    }
  }

  const attempts: RendererFailure['attempts'] = []
  if (await dependencies.hasWebGpu()) {
    try {
      return await createAttempt(canvas, scene, camera, dependencies.webGpu, dependencies.nextFrame)
    } catch (error) {
      attempts.push({ mode: 'auto', reason: error instanceof Error ? error.message : String(error) })
    }
  }

  try {
    return await createAttempt(canvas, scene, camera, dependencies.webGl2, dependencies.nextFrame)
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
