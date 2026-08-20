import { GAME_CONFIG } from '../config'
import type { GameAction, GameState } from '../types'

export const initialGameState = (bestScore = 0): GameState => ({
  phase: 'booting',
  backend: null,
  score: 0,
  bestScore: Math.max(0, Math.floor(bestScore)),
  currentPieceId: null,
  nextPieceId: null,
  horizontalPosition: 0,
  runId: 1,
  message: null,
})

const clampPosition = (value: number) =>
  Math.max(-GAME_CONFIG.horizontalLimit, Math.min(GAME_CONFIG.horizontalLimit, value))

export function reduceGameState(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'best-score-loaded':
      return { ...state, bestScore: Math.max(state.bestScore, Math.max(0, Math.floor(action.value))) }
    case 'renderer-ready':
      if (state.phase !== 'booting') return state
      return {
        ...state,
        phase: 'aiming',
        backend: action.backend,
        currentPieceId: action.currentPieceId,
        nextPieceId: action.nextPieceId,
        horizontalPosition: 0,
        message: null,
      }
    case 'move':
      if (state.phase !== 'aiming') return state
      return { ...state, horizontalPosition: clampPosition(action.position) }
    case 'drop':
      if (state.phase !== 'aiming' || !state.currentPieceId) return state
      return { ...state, phase: 'dropping' }
    case 'contact':
      if (state.phase !== 'dropping') return state
      return { ...state, phase: 'settling' }
    case 'stabilized': {
      if (state.phase !== 'settling' || !state.nextPieceId) return state
      const score = state.score + 1
      return {
        ...state,
        phase: 'aiming',
        score,
        bestScore: Math.max(state.bestScore, score),
        currentPieceId: state.nextPieceId,
        nextPieceId: action.nextPieceId,
        horizontalPosition: 0,
      }
    }
    case 'fell':
      if (state.phase !== 'dropping' && state.phase !== 'settling' && !(state.phase === 'aiming' && state.score > 0)) return state
      return { ...state, phase: 'game-over', bestScore: Math.max(state.bestScore, state.score) }
    case 'restart':
      if (state.phase !== 'game-over') return state
      return {
        ...state,
        phase: 'aiming',
        score: 0,
        currentPieceId: action.currentPieceId,
        nextPieceId: action.nextPieceId,
        horizontalPosition: 0,
        runId: state.runId + 1,
        message: null,
      }
    case 'compatibility-error':
      if (state.phase !== 'booting') return state
      return { ...state, phase: 'compatibility-error', message: action.message }
    case 'retry':
      if (state.phase !== 'compatibility-error') return state
      return {
        ...initialGameState(state.bestScore),
        runId: state.runId + 1,
      }
    default:
      return state
  }
}
