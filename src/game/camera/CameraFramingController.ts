import { PIECE_CATALOG } from '../pieces/catalog'
import type { GamePhase } from '../types'

export interface CameraFramingSample {
  pieceId: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number; w: number }
  fallen: boolean
  role?: 'physical' | 'aiming'
}

export interface CameraHomeComposition {
  position: readonly [number, number, number]
  target: readonly [number, number, number]
}

export interface CameraFramingInput {
  deltaSeconds: number
  phase: GamePhase
  runId: number
  aspect: number
  verticalFovDegrees: number
  reducedMotion: boolean
  samples: readonly CameraFramingSample[]
  aimingSample?: CameraFramingSample
}

export interface CameraFramingOutput {
  targetY: number
  distance: number
  mode: 'build' | 'collapse' | 'restart' | 'reduced'
  rawTargetY: number
  requiredDistance: number
}

interface LocalBounds {
  centerX: number
  centerY: number
  centerZ: number
  halfX: number
  halfY: number
  halfZ: number
}

const SAFE_WIDTH = 0.88
const SAFE_HEIGHT = 0.84
const TARGET_DEADBAND = 0.08
const DISTANCE_DEADBAND = 0.02
const DOWNWARD_HYSTERESIS_SECONDS = 0.3
const MAX_DISTANCE = 32
const PEDESTAL_HALF_XZ = 1.25
const PEDESTAL_HALF_Y = 0.21

const PIECE_BOUNDS = new Map<string, LocalBounds>()

for (const piece of PIECE_CATALOG) {
  let minX = -piece.dimensions[0] / 2
  let maxX = piece.dimensions[0] / 2
  let minY = -piece.dimensions[1] / 2
  let maxY = piece.dimensions[1] / 2
  let minZ = -piece.dimensions[2] / 2
  let maxZ = piece.dimensions[2] / 2
  for (const collider of piece.colliders) {
    const [halfX, halfY, halfZ] = collider.halfExtents
    const [offsetX, offsetY, offsetZ] = collider.offset ?? [0, 0, 0]
    minX = Math.min(minX, offsetX - halfX)
    maxX = Math.max(maxX, offsetX + halfX)
    minY = Math.min(minY, offsetY - halfY)
    maxY = Math.max(maxY, offsetY + halfY)
    minZ = Math.min(minZ, offsetZ - halfZ)
    maxZ = Math.max(maxZ, offsetZ + halfZ)
  }
  PIECE_BOUNDS.set(piece.id, {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    centerZ: (minZ + maxZ) / 2,
    halfX: (maxX - minX) / 2,
    halfY: (maxY - minY) / 2,
    halfZ: (maxZ - minZ) / 2,
  })
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value))

export class CameraFramingController {
  readonly homeDistance: number

  private readonly homeTargetY: number
  private readonly rightX: number
  private readonly rightY: number
  private readonly rightZ: number
  private readonly upX: number
  private readonly upY: number
  private readonly upZ: number
  private readonly forwardX: number
  private readonly forwardY: number
  private readonly forwardZ: number
  private currentTargetY: number
  private currentDistance: number
  private acceptedTargetY: number
  private acceptedDistance: number
  private targetDownwardSeconds = 0
  private distanceDownwardSeconds = 0
  private lastRunId: number | null = null
  private restartActive = false
  private minX = 0
  private minY = 0
  private minZ = 0
  private maxX = 0
  private maxY = 0
  private maxZ = 0

  constructor(home: CameraHomeComposition) {
    const dx = home.position[0] - home.target[0]
    const dy = home.position[1] - home.target[1]
    const dz = home.position[2] - home.target[2]
    this.homeDistance = Math.hypot(dx, dy, dz)
    this.homeTargetY = home.target[1]
    this.currentTargetY = this.homeTargetY
    this.acceptedTargetY = this.homeTargetY
    this.currentDistance = this.homeDistance
    this.acceptedDistance = this.homeDistance

    this.forwardX = -dx / this.homeDistance
    this.forwardY = -dy / this.homeDistance
    this.forwardZ = -dz / this.homeDistance
    const rightLength = Math.hypot(-this.forwardZ, this.forwardX)
    this.rightX = -this.forwardZ / rightLength
    this.rightY = 0
    this.rightZ = this.forwardX / rightLength
    this.upX = this.rightY * this.forwardZ - this.rightZ * this.forwardY
    this.upY = this.rightZ * this.forwardX - this.rightX * this.forwardZ
    this.upZ = this.rightX * this.forwardY - this.rightY * this.forwardX
  }

  step(input: CameraFramingInput): CameraFramingOutput {
    const deltaSeconds = clamp(input.deltaSeconds, 0, 0.1)
    const runChanged = this.lastRunId !== null && this.lastRunId !== input.runId
    this.lastRunId = input.runId
    if (runChanged) {
      this.targetDownwardSeconds = 0
      this.distanceDownwardSeconds = 0
      this.restartActive = true
    }

    this.resetEnvelope()
    for (const sample of input.samples) this.includeSample(sample)
    if (input.phase === 'aiming' && input.aimingSample) this.includeSample(input.aimingSample)

    const rawTargetY = Math.max(this.homeTargetY, (this.minY + this.maxY) / 2)
    const immediateDownward = input.phase === 'game-over' || runChanged || input.reducedMotion
    this.updateAcceptedTarget(rawTargetY, deltaSeconds, immediateDownward)
    const requiredDistance = this.computeRequiredDistance(
      rawTargetY,
      input.aspect,
      input.verticalFovDegrees,
    )
    const acceptedRequiredDistance = Math.abs(this.acceptedTargetY - rawTargetY) < 1e-9
      ? requiredDistance
      : this.computeRequiredDistance(this.acceptedTargetY, input.aspect, input.verticalFovDegrees)
    this.updateAcceptedDistance(acceptedRequiredDistance, deltaSeconds, immediateDownward)

    const mode: CameraFramingOutput['mode'] = input.reducedMotion
      ? 'reduced'
      : this.restartActive
        ? 'restart'
        : input.phase === 'game-over'
          ? 'collapse'
          : 'build'
    const t90 = mode === 'reduced' ? 0.3 : mode === 'restart' ? 0.9 : mode === 'collapse' ? 1.8 : 1.4
    const alpha = 1 - Math.exp((-Math.LN10 * deltaSeconds) / t90)
    this.currentTargetY += (this.acceptedTargetY - this.currentTargetY) * alpha
    this.currentDistance += (this.acceptedDistance - this.currentDistance) * alpha
    if (
      this.restartActive
      && Math.abs(this.acceptedTargetY - this.currentTargetY) < 0.001
      && Math.abs(this.acceptedDistance - this.currentDistance) < 0.001
    ) {
      this.restartActive = false
    }

    return {
      targetY: this.currentTargetY,
      distance: this.currentDistance,
      mode,
      rawTargetY,
      requiredDistance,
    }
  }

  private resetEnvelope() {
    this.minX = -PEDESTAL_HALF_XZ
    this.maxX = PEDESTAL_HALF_XZ
    this.minY = -PEDESTAL_HALF_Y
    this.maxY = PEDESTAL_HALF_Y
    this.minZ = -PEDESTAL_HALF_XZ
    this.maxZ = PEDESTAL_HALF_XZ
  }

  private includeSample(sample: CameraFramingSample) {
    if (sample.fallen) return
    const bounds = PIECE_BOUNDS.get(sample.pieceId)
    if (!bounds) return
    const { x, y, z, w } = sample.rotation
    const xx = x * x
    const yy = y * y
    const zz = z * z
    const xy = x * y
    const xz = x * z
    const yz = y * z
    const wx = w * x
    const wy = w * y
    const wz = w * z
    const r00 = 1 - 2 * (yy + zz)
    const r01 = 2 * (xy - wz)
    const r02 = 2 * (xz + wy)
    const r10 = 2 * (xy + wz)
    const r11 = 1 - 2 * (xx + zz)
    const r12 = 2 * (yz - wx)
    const r20 = 2 * (xz - wy)
    const r21 = 2 * (yz + wx)
    const r22 = 1 - 2 * (xx + yy)
    const centerX = sample.position.x + r00 * bounds.centerX + r01 * bounds.centerY + r02 * bounds.centerZ
    const centerY = sample.position.y + r10 * bounds.centerX + r11 * bounds.centerY + r12 * bounds.centerZ
    const centerZ = sample.position.z + r20 * bounds.centerX + r21 * bounds.centerY + r22 * bounds.centerZ
    const halfX = Math.abs(r00) * bounds.halfX + Math.abs(r01) * bounds.halfY + Math.abs(r02) * bounds.halfZ
    const halfY = Math.abs(r10) * bounds.halfX + Math.abs(r11) * bounds.halfY + Math.abs(r12) * bounds.halfZ
    const halfZ = Math.abs(r20) * bounds.halfX + Math.abs(r21) * bounds.halfY + Math.abs(r22) * bounds.halfZ
    this.minX = Math.min(this.minX, centerX - halfX)
    this.maxX = Math.max(this.maxX, centerX + halfX)
    this.minY = Math.min(this.minY, centerY - halfY)
    this.maxY = Math.max(this.maxY, centerY + halfY)
    this.minZ = Math.min(this.minZ, centerZ - halfZ)
    this.maxZ = Math.max(this.maxZ, centerZ + halfZ)
  }

  private updateAcceptedTarget(rawTargetY: number, deltaSeconds: number, immediateDownward: boolean) {
    if (rawTargetY > this.acceptedTargetY + TARGET_DEADBAND) {
      this.acceptedTargetY = rawTargetY
      this.targetDownwardSeconds = 0
      return
    }
    if (rawTargetY < this.acceptedTargetY - TARGET_DEADBAND) {
      if (immediateDownward) {
        this.acceptedTargetY = rawTargetY
        this.targetDownwardSeconds = 0
        return
      }
      this.targetDownwardSeconds += deltaSeconds
      if (this.targetDownwardSeconds >= DOWNWARD_HYSTERESIS_SECONDS) {
        this.acceptedTargetY = rawTargetY
        this.targetDownwardSeconds = 0
      }
      return
    }
    this.targetDownwardSeconds = 0
  }

  private updateAcceptedDistance(requiredDistance: number, deltaSeconds: number, immediateDownward: boolean) {
    if (requiredDistance > this.acceptedDistance + DISTANCE_DEADBAND) {
      this.acceptedDistance = requiredDistance
      this.distanceDownwardSeconds = 0
      return
    }
    if (requiredDistance < this.acceptedDistance - DISTANCE_DEADBAND) {
      if (immediateDownward) {
        this.acceptedDistance = requiredDistance
        this.distanceDownwardSeconds = 0
        return
      }
      this.distanceDownwardSeconds += deltaSeconds
      if (this.distanceDownwardSeconds >= DOWNWARD_HYSTERESIS_SECONDS) {
        this.acceptedDistance = requiredDistance
        this.distanceDownwardSeconds = 0
      }
      return
    }
    this.distanceDownwardSeconds = 0
  }

  private computeRequiredDistance(targetY: number, aspect: number, verticalFovDegrees: number) {
    const tanVertical = Math.tan((verticalFovDegrees * Math.PI) / 360)
    const tanHorizontal = tanVertical * Math.max(0.1, aspect)
    let required = this.homeDistance
    for (let corner = 0; corner < 8; corner += 1) {
      const x = (corner & 1) === 0 ? this.minX : this.maxX
      const y = (corner & 2) === 0 ? this.minY : this.maxY
      const z = (corner & 4) === 0 ? this.minZ : this.maxZ
      const relativeX = x
      const relativeY = y - targetY
      const relativeZ = z
      const horizontal = relativeX * this.rightX + relativeY * this.rightY + relativeZ * this.rightZ
      const vertical = relativeX * this.upX + relativeY * this.upY + relativeZ * this.upZ
      const forward = relativeX * this.forwardX + relativeY * this.forwardY + relativeZ * this.forwardZ
      required = Math.max(
        required,
        Math.abs(horizontal) / (tanHorizontal * SAFE_WIDTH) - forward,
        Math.abs(vertical) / (tanVertical * SAFE_HEIGHT) - forward,
        0.5 - forward,
      )
    }
    return clamp(required, this.homeDistance, MAX_DISTANCE)
  }
}
