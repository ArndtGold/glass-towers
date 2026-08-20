export type GamePhase =
  | 'booting'
  | 'aiming'
  | 'dropping'
  | 'settling'
  | 'game-over'
  | 'compatibility-error'

export type RendererBackend = 'webgpu' | 'webgl2'

export interface GameState {
  phase: GamePhase
  backend: RendererBackend | null
  score: number
  bestScore: number
  currentPieceId: string | null
  nextPieceId: string | null
  horizontalPosition: number
  runId: number
  message: string | null
}

export type GameAction =
  | { type: 'renderer-ready'; backend: RendererBackend; currentPieceId: string; nextPieceId: string }
  | { type: 'move'; position: number }
  | { type: 'drop' }
  | { type: 'contact' }
  | { type: 'stabilized'; nextPieceId: string }
  | { type: 'fell' }
  | { type: 'restart'; currentPieceId: string; nextPieceId: string }
  | { type: 'compatibility-error'; message: string }
  | { type: 'retry' }
  | { type: 'best-score-loaded'; value: number }

export interface GameIntent {
  type: 'move' | 'drop' | 'restart'
  position?: number
}

export interface RendererStatus {
  backend: RendererBackend
  qualityTier: 'high' | 'compatible'
}

export interface RendererFailure {
  kind: 'renderer-unavailable'
  message: string
  attempts: Array<{ mode: 'auto' | 'forced-webgl2'; reason: string }>
}
