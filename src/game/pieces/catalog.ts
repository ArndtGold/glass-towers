export type PieceGeometry = 'box' | 'cylinder' | 'compound'

export interface ColliderBox {
  halfExtents: readonly [number, number, number]
  offset?: readonly [number, number, number]
}

export interface PieceDefinition {
  id: string
  label: string
  geometry: PieceGeometry
  dimensions: readonly [number, number, number]
  color: number
  density: number
  colliders: readonly ColliderBox[]
}

export const PIECE_CATALOG: readonly PieceDefinition[] = [
  {
    id: 'prism',
    label: 'Prism',
    geometry: 'box',
    dimensions: [1.2, 0.62, 0.88],
    color: 0xb9e7ee,
    density: 1.05,
    colliders: [{ halfExtents: [0.6, 0.31, 0.44] }],
  },
  {
    id: 'pillar',
    label: 'Pillar',
    geometry: 'box',
    dimensions: [0.52, 1.28, 0.52],
    color: 0xf1c8d5,
    density: 1.22,
    colliders: [{ halfExtents: [0.26, 0.64, 0.26] }],
  },
  {
    id: 'slab',
    label: 'Slab',
    geometry: 'box',
    dimensions: [1.56, 0.34, 0.7],
    color: 0xd6d0f2,
    density: 0.92,
    colliders: [{ halfExtents: [0.78, 0.17, 0.35] }],
  },
  {
    id: 'drum',
    label: 'Drum',
    geometry: 'cylinder',
    dimensions: [0.82, 0.72, 0.82],
    color: 0xf0d8aa,
    density: 1.12,
    colliders: [{ halfExtents: [0.41, 0.36, 0.41] }],
  },
  {
    id: 'offset',
    label: 'Offset',
    geometry: 'compound',
    dimensions: [1.3, 0.78, 0.7],
    color: 0xbfd8c6,
    density: 1.18,
    colliders: [
      { halfExtents: [0.5, 0.22, 0.35], offset: [-0.15, -0.13, 0] },
      { halfExtents: [0.28, 0.34, 0.28], offset: [0.39, 0.18, 0] },
    ],
  },
] as const

export function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0 || 0x6d2b79f5
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function createPieceSequence(seed: number) {
  const random = createSeededRandom(seed)
  let previous = -1
  return () => {
    let index = Math.floor(random() * PIECE_CATALOG.length)
    if (index === previous) index = (index + 1) % PIECE_CATALOG.length
    previous = index
    return PIECE_CATALOG[index]
  }
}

export function getPieceDefinition(id: string): PieceDefinition {
  const piece = PIECE_CATALOG.find((entry) => entry.id === id)
  if (!piece) throw new Error(`Unknown piece: ${id}`)
  return piece
}
