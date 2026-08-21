import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../../src/game/physics/PhysicsWorld'
import { getPieceDefinition } from '../../src/game/pieces/catalog'

describe('PhysicsWorld', () => {
  it('contacts and stabilizes a centered piece exactly once', async () => {
    const physics = await PhysicsWorld.create()
    physics.spawnPiece(getPieceDefinition('prism'), { x: 0, y: 2.8, z: 0 })
    let contacts = 0
    let stabilizations = 0
    let fell = false

    for (let index = 0; index < 600; index += 1) {
      const events = physics.step(1 / 60)
      if (events.contacted) contacts += 1
      if (events.stabilized) stabilizations += 1
      fell ||= events.fell
    }

    expect(contacts).toBe(1)
    expect(stabilizations).toBe(1)
    expect(fell).toBe(false)
    expect(physics.snapshots()[0]).toMatchObject({ pieceId: 'prism', fallen: false })
    expect(physics.snapshots()[0].position.y).toBeGreaterThan(0)
    physics.dispose()
  })

  it('reports a piece that misses the pedestal', async () => {
    const physics = await PhysicsWorld.create()
    physics.spawnPiece(getPieceDefinition('pillar'), { x: 3.1, y: 2.8, z: 0 })
    let fell = false

    for (let index = 0; index < 600 && !fell; index += 1) fell = physics.step(1 / 60).fell

    expect(fell).toBe(true)
    expect(physics.snapshots()[0]).toMatchObject({ pieceId: 'pillar', fallen: true })
    physics.dispose()
  })
})
