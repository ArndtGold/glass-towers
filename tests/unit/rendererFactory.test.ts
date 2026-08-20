import type { Camera, Scene } from 'three'
import { describe, expect, it, vi } from 'vitest'
import {
  createRendererSession,
  type GlassRenderer,
  type RendererAdapter,
  type RendererDependencies,
} from '../../src/game/rendering/RendererFactory'

const scene = {} as Scene
const camera = {} as Camera

function renderer() {
  return {
    outputColorSpace: '',
    toneMapping: 0,
    toneMappingExposure: 0,
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  } satisfies GlassRenderer
}

function adapter(backend: 'webgpu' | 'webgl2', value: GlassRenderer, initialize = vi.fn(async () => undefined)) {
  return {
    backend,
    create: vi.fn(() => value),
    initialize,
  } satisfies RendererAdapter
}

function dependencies(
  hasWebGpu: boolean,
  webGpu: RendererAdapter,
  webGl2: RendererAdapter,
): RendererDependencies {
  return {
    hasWebGpu: () => hasWebGpu,
    webGpu,
    webGl2,
    nextFrame: vi.fn(async () => undefined),
  }
}

describe('createRendererSession', () => {
  it('uses WebGPU when capability and stable presentation succeed', async () => {
    const webGpuRenderer = renderer()
    const webGlRenderer = renderer()
    const deps = dependencies(true, adapter('webgpu', webGpuRenderer), adapter('webgl2', webGlRenderer))

    const session = await createRendererSession(document.createElement('canvas'), scene, camera, 'auto', deps)

    expect(session.status.backend).toBe('webgpu')
    expect(deps.webGpu.create).toHaveBeenCalledOnce()
    expect(deps.webGl2.create).not.toHaveBeenCalled()
    expect(webGpuRenderer.render).toHaveBeenCalledTimes(2)
  })

  it('skips WebGPU and starts classic WebGL2 when navigator.gpu is unavailable', async () => {
    const webGpuRenderer = renderer()
    const webGlRenderer = renderer()
    const deps = dependencies(false, adapter('webgpu', webGpuRenderer), adapter('webgl2', webGlRenderer))

    const session = await createRendererSession(document.createElement('canvas'), scene, camera, 'auto', deps)

    expect(session.status.backend).toBe('webgl2')
    expect(deps.webGpu.create).not.toHaveBeenCalled()
    expect(deps.webGl2.create).toHaveBeenCalledOnce()
    expect(webGlRenderer.render).toHaveBeenCalledTimes(2)
  })

  it('disposes a failed WebGPU attempt before exactly one WebGL2 fallback', async () => {
    const webGpuRenderer = renderer()
    const webGlRenderer = renderer()
    const webGpu = adapter('webgpu', webGpuRenderer, vi.fn(async () => { throw new Error('webgpu failed') }))
    const webGl2 = adapter('webgl2', webGlRenderer)
    const deps = dependencies(true, webGpu, webGl2)

    const session = await createRendererSession(document.createElement('canvas'), scene, camera, 'auto', deps)

    expect(session.status.backend).toBe('webgl2')
    expect(webGpuRenderer.dispose).toHaveBeenCalledOnce()
    expect(webGl2.create).toHaveBeenCalledOnce()
  })

  it('falls back when WebGPU cannot present stable frames', async () => {
    const webGpuRenderer = renderer()
    const webGlRenderer = renderer()
    vi.mocked(webGpuRenderer.render).mockImplementationOnce(() => { throw new Error('presentation failed') })
    const deps = dependencies(true, adapter('webgpu', webGpuRenderer), adapter('webgl2', webGlRenderer))

    const session = await createRendererSession(document.createElement('canvas'), scene, camera, 'auto', deps)

    expect(session.status.backend).toBe('webgl2')
    expect(webGpuRenderer.dispose).toHaveBeenCalledOnce()
    expect(webGlRenderer.render).toHaveBeenCalledTimes(2)
  })

  it('normalizes an unavailable explicit WebGL2 context', async () => {
    const unavailableWebGl2: RendererAdapter = {
      backend: 'webgl2',
      create: vi.fn(() => { throw new Error('WebGL2 context is unavailable') }),
      initialize: vi.fn(async () => undefined),
    }
    const deps = dependencies(false, adapter('webgpu', renderer()), unavailableWebGl2)

    await expect(createRendererSession(document.createElement('canvas'), scene, camera, 'force-webgl2', deps)).rejects.toMatchObject({
      kind: 'renderer-unavailable',
      attempts: [{ mode: 'forced-webgl2', reason: 'WebGL2 context is unavailable' }],
    })
    expect(unavailableWebGl2.create).toHaveBeenCalledOnce()
  })

  it('reports the bounded double failure with both attempt reasons', async () => {
    const webGpuRenderer = renderer()
    const webGlRenderer = renderer()
    const deps = dependencies(
      true,
      adapter('webgpu', webGpuRenderer, vi.fn(async () => { throw new Error('webgpu failed') })),
      adapter('webgl2', webGlRenderer, vi.fn(async () => { throw new Error('webgl2 failed') })),
    )

    await expect(createRendererSession(document.createElement('canvas'), scene, camera, 'auto', deps)).rejects.toMatchObject({
      kind: 'renderer-unavailable',
      attempts: [
        { mode: 'auto', reason: 'webgpu failed' },
        { mode: 'forced-webgl2', reason: 'webgl2 failed' },
      ],
    })
    expect(webGpuRenderer.dispose).toHaveBeenCalledOnce()
    expect(webGlRenderer.dispose).toHaveBeenCalledOnce()
  })
})
