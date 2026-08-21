import { Box3, Mesh, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { PIECE_CATALOG } from '../../src/game/pieces/catalog'
import { createPieceVisualGeometry, createSceneBundle } from '../../src/game/rendering/createScene'

describe('piece visual geometry', () => {
  it('keeps every beveled visual inside the approved outer-dimension tolerance', () => {
    for (const piece of PIECE_CATALOG) {
      const geometry = createPieceVisualGeometry(piece)
      geometry.computeBoundingBox()
      const size = geometry.boundingBox!.getSize(new Vector3())

      if (piece.geometry !== 'compound') {
        expect(size.x).toBeCloseTo(piece.dimensions[0], 2)
        expect(size.y).toBeCloseTo(piece.dimensions[1], 2)
        expect(size.z).toBeCloseTo(piece.dimensions[2], 2)
      }
      expect(geometry.attributes.normal).toBeDefined()
      geometry.dispose()
    }
  })

  it('renders the compound definition as exactly one visible mesh', () => {
    const piece = PIECE_CATALOG.find((entry) => entry.geometry === 'compound')!
    const bundle = createSceneBundle(16 / 9)
    bundle.configureRendererBackend('webgl2')
    const object = bundle.createPieceObject(piece, 'webgl2')
    const meshes: Mesh[] = []
    object.traverse((child) => {
      if ((child as Mesh).isMesh) meshes.push(child as Mesh)
    })

    expect(meshes).toHaveLength(1)
    const bounds = new Box3().setFromObject(object)
    const size = bounds.getSize(new Vector3())
    const minimum = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
    const maximum = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY)
    for (const collider of piece.colliders) {
      const offset = new Vector3(...(collider.offset ?? [0, 0, 0]))
      const halfExtents = new Vector3(...collider.halfExtents)
      minimum.min(offset.clone().sub(halfExtents))
      maximum.max(offset.clone().add(halfExtents))
    }
    expect(size.x).toBeCloseTo(maximum.x - minimum.x, 2)
    expect(size.y).toBeCloseTo(maximum.y - minimum.y, 2)
    expect(size.z).toBeCloseTo(maximum.z - minimum.z, 2)
    expect(piece.colliders).toHaveLength(2)

    bundle.dispose()
  })
})
