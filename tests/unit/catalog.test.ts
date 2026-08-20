import { describe, expect, it } from 'vitest'
import { PIECE_CATALOG, createPieceSequence } from '../../src/game/pieces/catalog'

describe('piece catalog', () => {
  it('contains five valid and distinct profiles', () => {
    expect(PIECE_CATALOG).toHaveLength(5)
    expect(new Set(PIECE_CATALOG.map((piece) => piece.id)).size).toBe(5)
    for (const piece of PIECE_CATALOG) {
      expect(piece.density).toBeGreaterThan(0)
      expect(piece.colliders.length).toBeGreaterThan(0)
    }
  })

  it('generates a repeatable sequence without immediate duplicates', () => {
    const first = createPieceSequence(42)
    const second = createPieceSequence(42)
    const a = Array.from({ length: 12 }, () => first().id)
    const b = Array.from({ length: 12 }, () => second().id)
    expect(a).toEqual(b)
    expect(a.every((value, index) => index === 0 || value !== a[index - 1])).toBe(true)
  })
})
