import type { Collider, RigidBody, World } from '@dimforge/rapier3d-compat'
import type { PieceDefinition } from '../pieces/catalog'
import { GAME_CONFIG } from '../config'

type RapierModule = typeof import('@dimforge/rapier3d-compat').default

export interface PhysicsPieceSnapshot {
  id: number
  pieceId: string
  fallen: boolean
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number; w: number }
}

export interface PhysicsEvents {
  contacted: boolean
  stabilized: boolean
  fell: boolean
}

interface PieceBody {
  id: number
  body: RigidBody
  colliders: Collider[]
  definition: PieceDefinition
  stableSteps: number
  contacted: boolean
  scored: boolean
  fallen: boolean
}

export class PhysicsWorld {
  private world: World
  private pieces = new Map<number, PieceBody>()
  private activeId: number | null = null
  private nextId = 1
  private accumulator: number = 0

  private constructor(world: World, private readonly rapier: RapierModule) {
    this.world = world
  }

  static async create() {
    const { default: RAPIER } = await import('@dimforge/rapier3d-compat')
    await RAPIER.init()
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
    world.timestep = GAME_CONFIG.fixedTimeStep
    const pedestal = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0))
    world.createCollider(RAPIER.ColliderDesc.cuboid(1.25, 0.21, 1.25).setFriction(0.9), pedestal)
    return new PhysicsWorld(world, RAPIER)
  }

  spawnPiece(definition: PieceDefinition, position: { x: number; y: number; z: number }, rotationY = 0) {
    const body = this.world.createRigidBody(
      this.rapier.RigidBodyDesc.dynamic()
        .setTranslation(position.x, position.y, position.z)
        .setRotation({ x: 0, y: Math.sin(rotationY / 2), z: 0, w: Math.cos(rotationY / 2) })
        .setLinearDamping(0.08)
        .setAngularDamping(0.12)
        .setCcdEnabled(true),
    )
    const colliders = definition.colliders.map((entry) => {
      const [hx, hy, hz] = entry.halfExtents
      const descriptor = this.rapier.ColliderDesc.cuboid(hx, hy, hz)
        .setDensity(definition.density)
        .setFriction(0.76)
        .setRestitution(0.04)
      if (entry.offset) descriptor.setTranslation(...entry.offset)
      return this.world.createCollider(descriptor, body)
    })
    const id = this.nextId++
    this.pieces.set(id, {
      id,
      body,
      colliders,
      definition,
      stableSteps: 0,
      contacted: false,
      scored: false,
      fallen: false,
    })
    this.activeId = id
    return id
  }

  step(deltaSeconds: number): PhysicsEvents {
    this.accumulator = Math.min(
      this.accumulator + Math.min(deltaSeconds, 0.1),
      GAME_CONFIG.fixedTimeStep * GAME_CONFIG.maxCatchUpSteps,
    )
    const events: PhysicsEvents = { contacted: false, stabilized: false, fell: false }
    let steps = 0
    while (this.accumulator >= GAME_CONFIG.fixedTimeStep && steps < GAME_CONFIG.maxCatchUpSteps) {
      this.world.step()
      this.accumulator -= GAME_CONFIG.fixedTimeStep
      steps += 1
      this.evaluate(events)
    }
    return events
  }

  private evaluate(events: PhysicsEvents) {
    for (const piece of this.pieces.values()) {
      const position = piece.body.translation()
      if (!piece.fallen && (position.y < GAME_CONFIG.fallBoundaryY || Math.abs(position.x) > 6 || Math.abs(position.z) > 6)) {
        piece.fallen = true
        events.fell = true
      }
    }

    if (this.activeId === null) return
    const active = this.pieces.get(this.activeId)
    if (!active || active.fallen) return

    let hasContact = false
    for (const collider of active.colliders) {
      this.world.contactPairsWith(collider, () => {
        hasContact = true
      })
    }
    if (hasContact && !active.contacted) {
      active.contacted = true
      events.contacted = true
    }

    if (!active.contacted || active.scored) return
    const linear = active.body.linvel()
    const angular = active.body.angvel()
    const linearSpeed = Math.hypot(linear.x, linear.y, linear.z)
    const angularSpeed = Math.hypot(angular.x, angular.y, angular.z)
    if (
      active.body.isSleeping() ||
      (linearSpeed < GAME_CONFIG.linearSleepThreshold && angularSpeed < GAME_CONFIG.angularSleepThreshold)
    ) {
      active.stableSteps += 1
    } else {
      active.stableSteps = 0
    }
    if (active.stableSteps >= GAME_CONFIG.stableStepCount) {
      active.scored = true
      this.activeId = null
      events.stabilized = true
    }
  }

  snapshots(): PhysicsPieceSnapshot[] {
    return Array.from(this.pieces.values(), (piece) => {
      const position = piece.body.translation()
      const rotation = piece.body.rotation()
      return {
        id: piece.id,
        pieceId: piece.definition.id,
        fallen: piece.fallen,
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w },
      }
    })
  }

  towerHeight() {
    let top: number = GAME_CONFIG.pedestalTopY
    for (const piece of this.pieces.values()) {
      if (piece.fallen) continue
      const y = piece.body.translation().y + piece.definition.dimensions[1] / 2
      top = Math.max(top, y)
    }
    return top
  }

  reset() {
    for (const piece of this.pieces.values()) this.world.removeRigidBody(piece.body)
    this.pieces.clear()
    this.activeId = null
    this.accumulator = 0
  }

  dispose() {
    this.reset()
    this.world.free()
  }
}
