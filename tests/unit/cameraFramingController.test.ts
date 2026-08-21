import { describe, expect, it } from 'vitest'
import {
  CameraFramingController,
  type CameraFramingInput,
  type CameraFramingSample,
} from '../../src/game/camera/CameraFramingController'
import { PIECE_CATALOG } from '../../src/game/pieces/catalog'

const home = {
  position: [7.8, 5.6, 10.8] as const,
  target: [0, 2.2, 0] as const,
}

const sample = (
  pieceId = 'pillar',
  y = 7,
  fallen = false,
  rotation: CameraFramingSample['rotation'] = { x: 0, y: 0, z: 0, w: 1 },
): CameraFramingSample => ({
  pieceId,
  position: { x: 0, y, z: 0 },
  rotation,
  fallen,
  role: 'physical',
})

const input = (overrides: Partial<CameraFramingInput> = {}): CameraFramingInput => ({
  deltaSeconds: 1 / 60,
  phase: 'aiming',
  runId: 1,
  aspect: 16 / 9,
  verticalFovDegrees: 36,
  reducedMotion: false,
  samples: [sample()],
  ...overrides,
})

const advance = (controller: CameraFramingController, seconds: number, value: CameraFramingInput) => {
  let output = controller.step(value)
  const steps = Math.ceil(seconds / value.deltaSeconds)
  for (let index = 1; index < steps; index += 1) output = controller.step(value)
  return output
}

describe('CameraFramingController', () => {
  it('uses finite conservative framing for every catalog shape and rotation', () => {
    const halfAngle = Math.PI / 7
    for (const piece of PIECE_CATALOG) {
      const controller = new CameraFramingController(home)
      const output = controller.step(input({
        aspect: 9 / 16,
        samples: [sample(piece.id, 9, false, { x: 0, y: 0, z: Math.sin(halfAngle), w: Math.cos(halfAngle) })],
      }))
      expect(output.rawTargetY).toBeGreaterThan(2.2)
      expect(output.requiredDistance).toBeGreaterThanOrEqual(controller.homeDistance)
      expect(output.requiredDistance).toBeLessThan(32)
    }
  })

  it('accounts for rotated extents rather than only piece centers', () => {
    const flat = new CameraFramingController(home).step(input({ samples: [sample('slab', 7)] }))
    const angle = Math.PI / 4
    const rotated = new CameraFramingController(home).step(input({
      samples: [sample('slab', 7, false, { x: 0, y: 0, z: Math.sin(angle), w: Math.cos(angle) })],
    }))
    expect(rotated.rawTargetY).toBeGreaterThan(flat.rawTargetY)
  })

  it('keeps a twelve-piece envelope below the distance cap at all reference aspects', () => {
    const samples = Array.from({ length: 12 }, (_, index) => sample(
      PIECE_CATALOG[index % PIECE_CATALOG.length].id,
      0.9 + index * 0.72,
    ))
    for (const aspect of [16 / 9, 4 / 3, 9 / 16]) {
      const controller = new CameraFramingController(home)
      const output = controller.step(input({ aspect, samples }))
      expect(output.rawTargetY).toBeGreaterThan(4)
      expect(output.requiredDistance).toBeGreaterThanOrEqual(controller.homeDistance)
      expect(output.requiredDistance).toBeLessThan(32)
    }
  })

  it('excludes fallen and unknown fixture samples and only includes aim in aiming', () => {
    const excluded = new CameraFramingController(home).step(input({
      phase: 'dropping',
      samples: [sample('pillar', 20, true), sample('fixture', 20)],
      aimingSample: { ...sample('pillar', 20), role: 'aiming' },
    }))
    expect(excluded.rawTargetY).toBe(2.2)

    const aiming = new CameraFramingController(home).step(input({
      samples: [],
      aimingSample: { ...sample('pillar', 20), role: 'aiming' },
    }))
    expect(aiming.rawTargetY).toBeGreaterThan(9)
  })

  it('reaches build and collapse t90 without overshoot', () => {
    const controller = new CameraFramingController(home)
    const building = input()
    const first = controller.step(building)
    const built = advance(controller, 1.4 - building.deltaSeconds, building)
    expect(built.targetY).toBeGreaterThanOrEqual(2.2 + (first.rawTargetY - 2.2) * 0.9 - 0.01)
    expect(built.targetY).toBeLessThanOrEqual(first.rawTargetY)

    const collapse = input({ phase: 'game-over', samples: [sample('pillar', 7, true)] })
    const beforeCollapse = built.targetY
    const firstCollapse = controller.step(collapse)
    expect(firstCollapse.mode).toBe('collapse')
    expect(firstCollapse.targetY).toBeLessThan(beforeCollapse)
    const collapsed = advance(controller, 1.8 - collapse.deltaSeconds, collapse)
    expect(collapsed.targetY - 2.2).toBeLessThanOrEqual((beforeCollapse - 2.2) * 0.1 + 0.01)
    expect(collapsed.targetY).toBeGreaterThanOrEqual(2.2)
  })

  it('holds micro-movement and applies normal downward hysteresis', () => {
    const controller = new CameraFramingController(home)
    const high = input()
    const settled = advance(controller, 8, high)
    const micro = controller.step(input({ samples: [sample('pillar', 6.9)] }))
    expect(micro.targetY).toBeGreaterThanOrEqual(settled.targetY - 0.002)

    const lower = input({ samples: [sample('pillar', 4)] })
    const beforeHysteresis = controller.step(lower)
    advance(controller, 0.25, lower)
    const duringHysteresis = controller.step(lower)
    expect(duringHysteresis.targetY).toBeGreaterThanOrEqual(beforeHysteresis.targetY - 0.01)
    const afterHysteresis = advance(controller, 0.2, lower)
    expect(afterHysteresis.targetY).toBeLessThan(duringHysteresis.targetY)
  })

  it('resets history on restart and honors reduced motion t90', () => {
    const controller = new CameraFramingController(home)
    advance(controller, 8, input())
    const restart = input({ runId: 2, samples: [] })
    const firstRestart = controller.step(restart)
    expect(firstRestart.mode).toBe('restart')
    expect(firstRestart.targetY).toBeGreaterThan(2.2)
    const restarted = advance(controller, 0.9 - restart.deltaSeconds, restart)
    expect(restarted.targetY - 2.2).toBeLessThanOrEqual((firstRestart.targetY - 2.2) * 0.1 + 0.01)

    const reducedController = new CameraFramingController(home)
    const reduced = input({ reducedMotion: true })
    const reducedFirst = reducedController.step(reduced)
    const reducedDone = advance(reducedController, 0.3 - reduced.deltaSeconds, reduced)
    expect(reducedDone.mode).toBe('reduced')
    expect(reducedFirst.rawTargetY - reducedDone.targetY).toBeLessThanOrEqual(
      (reducedFirst.rawTargetY - 2.2) * 0.1 + 0.01,
    )
  })

  it('produces equivalent trajectories at 30, 60, and 120 Hz', () => {
    const positions = [30, 60, 120].map((frequency) => {
      const controller = new CameraFramingController(home)
      return advance(controller, 2, input({ deltaSeconds: 1 / frequency })).targetY
    })
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(0.05)
  })
})
