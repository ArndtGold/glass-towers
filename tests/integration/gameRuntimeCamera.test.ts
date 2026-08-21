import { afterEach, describe, expect, it, vi } from 'vitest'
import { Group, Object3D, PerspectiveCamera, Scene } from 'three'
import { createGameStore } from '../../src/game/state/gameStore'

const mocks = vi.hoisted(() => ({
  createRendererSession: vi.fn(),
  createSceneBundle: vi.fn(),
  createPhysics: vi.fn(),
  inputStart: vi.fn(),
  inputStop: vi.fn(),
}))

vi.mock('../../src/game/rendering/RendererFactory', () => ({
  createRendererSession: mocks.createRendererSession,
  isRendererFailure: () => false,
}))

vi.mock('../../src/game/rendering/createScene', () => ({
  createSceneBundle: mocks.createSceneBundle,
}))

vi.mock('../../src/game/physics/PhysicsWorld', () => ({
  PhysicsWorld: class {
    static create = mocks.createPhysics
  },
}))

vi.mock('../../src/game/input/InputController', () => ({
  InputController: class {
    start = mocks.inputStart
    stop = mocks.inputStop
  },
}))

vi.mock('../../src/game/testing/rendererStrategy', () => ({
  resolveRendererTestMode: () => 'force-webgl2',
}))

import { GameRuntime } from '../../src/game/runtime/GameRuntime'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

describe('GameRuntime camera integration', () => {
  it('uses one snapshot pass, applies fell before framing, renders once, and cleans the media listener', async () => {
    let scheduledFrame: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      scheduledFrame = callback
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const mediaChange = vi.fn()
    const removeMediaChange = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: mediaChange,
      removeEventListener: removeMediaChange,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))

    const render = vi.fn()
    const rendererDispose = vi.fn()
    mocks.createRendererSession.mockResolvedValue({
      status: { backend: 'webgl2', qualityTier: 'compatible' },
      renderer: { render, setSize: vi.fn() },
      dispose: rendererDispose,
    })
    const camera = new PerspectiveCamera(36, 16 / 9, 0.1, 80)
    camera.position.set(7.8, 5.6, 10.8)
    const worldRoot = new Group()
    const sceneDispose = vi.fn()
    mocks.createSceneBundle.mockReturnValue({
      scene: new Scene(),
      camera,
      cameraHome: { position: [7.8, 5.6, 10.8], target: [0, 2.2, 0] },
      worldRoot,
      createPieceObject: () => new Object3D(),
      configureRendererBackend: vi.fn(),
      getGalleryDiagnostics: () => ({
        profile: 'compatible',
        groupCount: 1,
        meshCount: 1,
        drawCallCount: 1,
        uniqueGeometryCount: 1,
        materialCount: 1,
        textureBytes: 0,
      }),
      dispose: sceneDispose,
    })

    const step = vi.fn(() => ({ contacted: false, stabilized: false, fell: true }))
    const snapshots = vi.fn(() => [{
      id: 1,
      pieceId: 'pillar',
      fallen: true,
      position: { x: 3, y: -3.1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    }])
    const physicsDispose = vi.fn()
    mocks.createPhysics.mockResolvedValue({
      step,
      snapshots,
      towerHeight: () => 2,
      spawnPiece: vi.fn(() => 1),
      reset: vi.fn(),
      dispose: physicsDispose,
    })

    const canvas = document.createElement('canvas')
    Object.defineProperty(canvas, 'clientWidth', { value: 1280 })
    Object.defineProperty(canvas, 'clientHeight', { value: 720 })
    document.body.append(canvas)
    const store = createGameStore()
    const runtime = new GameRuntime(canvas, store, { read: () => 0, write: vi.fn() })
    await runtime.start()
    store.dispatch({ type: 'drop' })
    expect(scheduledFrame).toBeTypeOf('function')
    scheduledFrame?.(performance.now() + 16)

    expect(step).toHaveBeenCalledTimes(1)
    expect(snapshots).toHaveBeenCalledTimes(1)
    expect(store.getState().phase).toBe('game-over')
    expect(canvas.dataset.cameraMode).toBe('collapse')
    expect(render).toHaveBeenCalledTimes(2)
    expect(mediaChange).toHaveBeenCalledTimes(1)

    runtime.dispose()
    expect(removeMediaChange).toHaveBeenCalledTimes(1)
    expect(canvas.dataset.cameraMode).toBeUndefined()
    expect(physicsDispose).toHaveBeenCalledTimes(1)
    expect(rendererDispose).toHaveBeenCalledTimes(1)
    expect(sceneDispose).toHaveBeenCalledTimes(1)
  })
})
