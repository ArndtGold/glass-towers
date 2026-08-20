import type { GameAction, GameState } from '../types'
import { initialGameState, reduceGameState } from './gameMachine'

export type GameListener = () => void

export interface GameStore {
  getState: () => GameState
  dispatch: (action: GameAction) => GameState
  subscribe: (listener: GameListener) => () => void
}

export function createGameStore(bestScore = 0): GameStore {
  let state = initialGameState(bestScore)
  const listeners = new Set<GameListener>()

  return {
    getState: () => state,
    dispatch: (action) => {
      const next = reduceGameState(state, action)
      if (next !== state) {
        state = next
        listeners.forEach((listener) => listener())
      }
      return state
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
