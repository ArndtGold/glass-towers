import { MathUtils, Object3D, Vector3 } from 'three'
import { GAME_CONFIG } from '../config'
import { InputController } from '../input/InputController'
import { PhysicsWorld } from '../physics/PhysicsWorld'
import { createPieceSequence, getPieceDefinition } from '../pieces/catalog'
import type { BestScoreRepository } from '../persistence/BestScoreRepository'
import { createRendererSession, isRendererFailure, type RendererSession } from '../rendering/RendererFactory'
import { createSceneBundle, type SceneBundle } from '../rendering/createScene'
import type { GameStore } from '../state/gameStore'
import { resolveRendererTestMode } from '../testing/rendererStrategy'
import type { GameIntent } from '../types'

export class GameRuntime {
  private sceneBundle: SceneBundle | null = null
  private rendererSession: RendererSession | null = null
  private physics: PhysicsWorld | null = null
  private input: InputController | null = null
  private aimingObject: Object3D | null = null
  private pieceObjects = new Map<number, Object3D>()
  private animationFrame = 0
  private lastTime = 0
  private disposed = false
  private sequence = createPieceSequence(this.initialSeed())
  private cameraTarget = new Vector3(0, 2.2, 0)
  private stressStartedAt = 0
  private stressFrameTimes: number[] = []
  private stressWorkTimes: number[] = []

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly store: GameStore,
    private readonly bestScore: BestScoreRepository,
  ) {}

  async start() {
    this.disposed = false
    const width = Math.max(1, this.canvas.clientWidth)
    const height = Math.max(1, this.canvas.clientHeight)
    const sceneBundle = createSceneBundle(width / height)
    this.sceneBundle = sceneBundle

    try {
      const rendererSession = await createRendererSession(
        this.canvas,
        sceneBundle.scene,
        sceneBundle.camera,
        resolveRendererTestMode(),
      )
      if (this.disposed) {
        rendererSession.dispose()
        return
      }
      this.rendererSession = rendererSession
      sceneBundle.configureRendererBackend(rendererSession.status.backend)
      rendererSession.renderer.render(sceneBundle.scene, sceneBundle.camera)
      const gallery = sceneBundle.getGalleryDiagnostics()
      this.canvas.dataset.galleryReady = 'true'
      this.canvas.dataset.galleryProfile = gallery.profile
      this.canvas.dataset.galleryGroups = String(gallery.groupCount)
      this.canvas.dataset.galleryMeshes = String(gallery.meshCount)
      this.canvas.dataset.galleryDrawCalls = String(gallery.drawCallCount)
      this.canvas.dataset.galleryGeometries = String(gallery.uniqueGeometryCount)
      this.canvas.dataset.galleryMaterials = String(gallery.materialCount)
      this.canvas.dataset.galleryTextureBytes = String(gallery.textureBytes)
      const physics = await PhysicsWorld.create()
      if (this.disposed) {
        physics.dispose()
        return
      }
      this.physics = physics

      const current = this.sequence()
      const next = this.sequence()
      this.store.dispatch({
        type: 'renderer-ready',
        backend: rendererSession.status.backend,
        currentPieceId: current.id,
        nextPieceId: next.id,
      })
      this.createAimingObject()
      this.input = new InputController(this.canvas, this.handleIntent)
      this.input.start()
      this.createStressFixtureIfRequested()
      window.addEventListener('resize', this.resize)
      this.lastTime = performance.now()
      this.animationFrame = requestAnimationFrame(this.frame)
    } catch (error) {
      if (this.disposed) return
      const message = isRendererFailure(error)
        ? 'WebGPU und der WebGL2-Fallback konnten nicht gestartet werden.'
        : 'Die 3D-Ansicht konnte nicht gestartet werden.'
      this.store.dispatch({ type: 'compatibility-error', message })
      this.rendererSession?.dispose()
      this.rendererSession = null
    }
  }

  private initialSeed() {
    if (!import.meta.env.DEV) return Date.now()
    const value = Number.parseInt(new URL(globalThis.location.href).searchParams.get('seed') ?? '', 10)
    return Number.isFinite(value) ? value : Date.now()
  }

  private createStressFixtureIfRequested() {
    if (!import.meta.env.DEV || !this.physics || !this.sceneBundle) return
    const requested = Number.parseInt(new URL(globalThis.location.href).searchParams.get('stress') ?? '', 10)
    const count = Math.max(0, Math.min(20, Number.isFinite(requested) ? requested : 0))
    if (count === 0) return
    const state = this.store.getState()
    if (!state.backend) return
    for (let index = 0; index < count; index += 1) {
      const definition = this.sequence()
      const lane = index % 4
      const level = Math.floor(index / 4)
      const position = {
        x: (lane - 1.5) * 0.48,
        y: 1.2 + level * 1.18,
        z: ((index % 2) - 0.5) * 0.42,
      }
      const object = this.sceneBundle.createPieceObject(definition, state.backend)
      object.position.set(position.x, position.y, position.z)
      this.sceneBundle.worldRoot.add(object)
      const id = this.physics.spawnPiece(definition, position, index * 0.19)
      this.pieceObjects.set(id, object)
    }
    this.canvas.dataset.stressPieces = String(count)
    this.rendererSession?.renderer.render(this.sceneBundle.scene, this.sceneBundle.camera)
    this.stressStartedAt = performance.now()
  }

  private recordStressFrame(now: number, workStartedAt: number) {
    if (this.stressStartedAt === 0 || this.canvas.dataset.stressP95Frame) return
    this.stressFrameTimes.push(now - this.lastTime)
    this.stressWorkTimes.push(performance.now() - workStartedAt)
    if (now - this.stressStartedAt < 10_000) return
    const percentile95 = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b)
      return sorted[Math.floor(sorted.length * 0.95)] ?? Number.POSITIVE_INFINITY
    }
    this.canvas.dataset.stressSamples = String(this.stressFrameTimes.length)
    this.canvas.dataset.stressP95Frame = percentile95(this.stressFrameTimes).toFixed(2)
    this.canvas.dataset.stressP95Work = percentile95(this.stressWorkTimes).toFixed(2)
  }

  private createAimingObject() {
    const state = this.store.getState()
    if (!this.sceneBundle || !state.backend || !state.currentPieceId) return
    this.removeAimingObject()
    const definition = getPieceDefinition(state.currentPieceId)
    const object = this.sceneBundle.createPieceObject(definition, state.backend)
    object.position.set(state.horizontalPosition, this.spawnHeight(), 0)
    object.rotation.set(0, 0, 0)
    this.sceneBundle.worldRoot.add(object)
    this.aimingObject = object
  }

  private removeAimingObject(dispose = false) {
    if (!this.aimingObject) return
    this.aimingObject.removeFromParent()
    if (dispose) this.disposeObject(this.aimingObject)
    this.aimingObject = null
  }

  private spawnHeight() {
    return (this.physics?.towerHeight() ?? GAME_CONFIG.pedestalTopY) + GAME_CONFIG.spawnClearance
  }

  private handleIntent = (intent: GameIntent) => {
    const state = this.store.getState()
    if (intent.type === 'move' && typeof intent.position === 'number') {
      const next = this.store.dispatch({ type: 'move', position: intent.position })
      if (this.aimingObject) this.aimingObject.position.x = next.horizontalPosition
      return
    }
    if (intent.type === 'drop' && state.phase === 'aiming' && state.currentPieceId && this.aimingObject && this.physics) {
      this.store.dispatch({ type: 'drop' })
      const definition = getPieceDefinition(state.currentPieceId)
      const object = this.aimingObject
      this.aimingObject = null
      const id = this.physics.spawnPiece(
        definition,
        { x: object.position.x, y: object.position.y, z: object.position.z },
        object.rotation.y,
      )
      this.pieceObjects.set(id, object)
      return
    }
    if (intent.type === 'restart') this.restart()
  }

  restart() {
    if (this.store.getState().phase !== 'game-over' || !this.physics) return
    this.physics.reset()
    this.clearPieceObjects()
    this.removeAimingObject(true)
    this.sequence = createPieceSequence(Date.now() + this.store.getState().runId)
    const current = this.sequence()
    const next = this.sequence()
    this.store.dispatch({ type: 'restart', currentPieceId: current.id, nextPieceId: next.id })
    this.createAimingObject()
  }

  private frame = (now: number) => {
    if (this.disposed || !this.rendererSession || !this.sceneBundle || !this.physics) return
    const workStartedAt = performance.now()
    const delta = Math.min((now - this.lastTime) / 1000, 0.1)

    const events = this.physics.step(delta)
    for (const snapshot of this.physics.snapshots()) {
      const object = this.pieceObjects.get(snapshot.id)
      if (!object) continue
      object.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z)
      object.quaternion.set(snapshot.rotation.x, snapshot.rotation.y, snapshot.rotation.z, snapshot.rotation.w)
    }

    if (events.contacted) {
      this.store.dispatch({ type: 'contact' })
      const activeObject = Array.from(this.pieceObjects.values()).at(-1)
      if (activeObject) {
        activeObject.scale.setScalar(1.055)
        activeObject.userData.impactAt = now
      }
    }
    for (const object of this.pieceObjects.values()) {
      if (typeof object.userData.impactAt === 'number') {
        const progress = Math.min(1, (now - object.userData.impactAt) / 180)
        object.scale.setScalar(MathUtils.lerp(1.055, 1, progress))
        if (progress === 1) delete object.userData.impactAt
      }
    }
    if (events.stabilized) {
      const newNext = this.sequence()
      const state = this.store.dispatch({ type: 'stabilized', nextPieceId: newNext.id })
      this.bestScore.write(state.bestScore)
      this.createAimingObject()
    }
    if (events.fell) {
      const state = this.store.dispatch({ type: 'fell' })
      this.bestScore.write(state.bestScore)
    }

    if (this.aimingObject && this.store.getState().phase === 'aiming') {
      this.aimingObject.position.y = this.spawnHeight() + Math.sin(now * 0.0023) * 0.06
    }

    const height = this.physics.towerHeight()
    const targetY = Math.max(2.2, height * 0.55)
    this.cameraTarget.y = MathUtils.lerp(this.cameraTarget.y, targetY, 1 - Math.exp(-delta * 2.3))
    this.sceneBundle.camera.position.y = MathUtils.lerp(
      this.sceneBundle.camera.position.y,
      Math.max(5.6, height + 3.2),
      1 - Math.exp(-delta * 1.7),
    )
    this.sceneBundle.camera.lookAt(this.cameraTarget)
    this.rendererSession.renderer.render(this.sceneBundle.scene, this.sceneBundle.camera)
    this.recordStressFrame(now, workStartedAt)
    this.lastTime = now

    this.animationFrame = requestAnimationFrame(this.frame)
  }

  private resize = () => {
    if (!this.sceneBundle || !this.rendererSession) return
    const width = Math.max(1, this.canvas.clientWidth)
    const height = Math.max(1, this.canvas.clientHeight)
    this.sceneBundle.camera.aspect = width / height
    this.sceneBundle.camera.updateProjectionMatrix()
    this.rendererSession.renderer.setSize(width, height, false)
  }

  private disposeObject(object: Object3D) {
    object.removeFromParent()
  }

  private clearPieceObjects() {
    for (const object of this.pieceObjects.values()) {
      object.removeFromParent()
      this.disposeObject(object)
    }
    this.pieceObjects.clear()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    window.removeEventListener('resize', this.resize)
    this.input?.stop()
    this.input = null
    this.removeAimingObject(false)
    this.pieceObjects.clear()
    this.physics?.dispose()
    this.physics = null
    this.rendererSession?.dispose()
    this.rendererSession = null
    this.sceneBundle?.dispose()
    this.sceneBundle = null
    delete this.canvas.dataset.galleryReady
    delete this.canvas.dataset.galleryProfile
    delete this.canvas.dataset.galleryGroups
    delete this.canvas.dataset.galleryMeshes
    delete this.canvas.dataset.galleryDrawCalls
    delete this.canvas.dataset.galleryGeometries
    delete this.canvas.dataset.galleryMaterials
    delete this.canvas.dataset.galleryTextureBytes
  }
}
