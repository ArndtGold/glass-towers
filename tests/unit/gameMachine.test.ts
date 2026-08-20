import { describe, expect, it } from 'vitest'
import { initialGameState, reduceGameState } from '../../src/game/state/gameMachine'

const ready = () =>
  reduceGameState(initialGameState(2), {
    type: 'renderer-ready',
    backend: 'webgl2',
    currentPieceId: 'prism',
    nextPieceId: 'pillar',
  })

describe('gameMachine', () => {
  it('accepts one drop and scores one stabilized piece', () => {
    const dropped = reduceGameState(ready(), { type: 'drop' })
    expect(reduceGameState(dropped, { type: 'drop' })).toBe(dropped)
    const settling = reduceGameState(dropped, { type: 'contact' })
    const scored = reduceGameState(settling, { type: 'stabilized', nextPieceId: 'slab' })
    expect(scored).toMatchObject({ phase: 'aiming', score: 1, currentPieceId: 'pillar', nextPieceId: 'slab' })
    expect(reduceGameState(scored, { type: 'stabilized', nextPieceId: 'drum' })).toBe(scored)
  })

  it('clamps movement and ignores it while dropping', () => {
    const moved = reduceGameState(ready(), { type: 'move', position: 99 })
    expect(moved.horizontalPosition).toBe(2.1)
    const dropped = reduceGameState(moved, { type: 'drop' })
    expect(reduceGameState(dropped, { type: 'move', position: -1 })).toBe(dropped)
  })

  it('enters game over once and restarts without losing the best score', () => {
    const dropped = reduceGameState(ready(), { type: 'drop' })
    const over = reduceGameState(dropped, { type: 'fell' })
    expect(over.phase).toBe('game-over')
    expect(reduceGameState(over, { type: 'fell' })).toBe(over)
    const restarted = reduceGameState(over, { type: 'restart', currentPieceId: 'drum', nextPieceId: 'offset' })
    expect(restarted).toMatchObject({ phase: 'aiming', score: 0, bestScore: 2, runId: 2 })
  })

  it('recovers from a visible compatibility error only through retry', () => {
    const failed = reduceGameState(initialGameState(), { type: 'compatibility-error', message: 'No renderer' })
    expect(failed.phase).toBe('compatibility-error')
    const retry = reduceGameState(failed, { type: 'retry' })
    expect(retry).toMatchObject({ phase: 'booting', runId: 2 })
  })
})
