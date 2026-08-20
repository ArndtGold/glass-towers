import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createBestScoreRepository } from '../game/persistence/BestScoreRepository'
import { getPieceDefinition } from '../game/pieces/catalog'
import { GameRuntime } from '../game/runtime/GameRuntime'
import { createGameStore } from '../game/state/gameStore'
import './styles.css'

const colorHex = (value: number) => `#${value.toString(16).padStart(6, '0')}`

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runtimeRef = useRef<GameRuntime | null>(null)
  const repository = useMemo(() => createBestScoreRepository(), [])
  const store = useMemo(() => createGameStore(repository.read()), [repository])
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  const [bootNonce, setBootNonce] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return
    const runtime = new GameRuntime(canvasRef.current, store, repository)
    runtimeRef.current = runtime
    void runtime.start()
    return () => {
      runtime.dispose()
      if (runtimeRef.current === runtime) runtimeRef.current = null
    }
  }, [bootNonce, repository, store])

  const nextPiece = state.nextPieceId ? getPieceDefinition(state.nextPieceId) : null
  const retry = () => {
    store.dispatch({ type: 'retry' })
    setBootNonce((value) => value + 1)
  }

  return (
    <main className="game-shell" data-phase={state.phase}>
      <canvas ref={canvasRef} className="game-canvas" aria-label="Glass Towers game canvas" />

      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">A study in balance</p>
          <h1>Glass Towers</h1>
        </div>
        <div className="scoreboard" aria-label="Score">
          <div><span>Score</span><strong data-testid="score">{state.score.toString().padStart(2, '0')}</strong></div>
          <div><span>Best</span><strong data-testid="best-score">{state.bestScore.toString().padStart(2, '0')}</strong></div>
        </div>
      </header>

      <aside className="next-card" aria-label="Next piece">
        <span className="next-label">Next</span>
        <span className="piece-swatch" style={{ '--piece-color': nextPiece ? colorHex(nextPiece.color) : '#d9d2cc' } as React.CSSProperties} />
        <strong>{nextPiece?.label ?? '—'}</strong>
      </aside>

      <div className="backend-badge" data-testid="renderer-backend">
        {state.backend === 'webgpu' ? 'WebGPU · High fidelity' : state.backend === 'webgl2' ? 'WebGL2 · Compatible' : 'Checking graphics'}
      </div>

      {state.phase === 'aiming' && <p className="instruction">Move to compose · click, tap, or press Space to drop</p>}
      {(state.phase === 'dropping' || state.phase === 'settling') && <p className="instruction quiet">Hold your breath…</p>}

      {state.phase === 'booting' && (
        <section className="modal-card loading" aria-live="polite">
          <span className="loader" />
          <p>Preparing the studio…</p>
        </section>
      )}

      {state.phase === 'game-over' && (
        <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
          <p className="eyebrow">Sculpture complete</p>
          <h2 id="game-over-title">Beautifully unstable.</h2>
          <p>You balanced <strong>{state.score}</strong> glass {state.score === 1 ? 'piece' : 'pieces'}.</p>
          <button type="button" onClick={() => runtimeRef.current?.restart()}>Build again</button>
          <small>Enter or R also restarts</small>
        </section>
      )}

      {state.phase === 'compatibility-error' && (
        <section className="modal-card" role="alert" aria-labelledby="compatibility-title">
          <p className="eyebrow">Graphics unavailable</p>
          <h2 id="compatibility-title">This sculpture needs WebGPU or WebGL2.</h2>
          <p>{state.message}</p>
          <button type="button" onClick={retry}>Try again</button>
          <small>Try an up-to-date browser or enable hardware acceleration.</small>
        </section>
      )}

      <footer>Balance is temporary.</footer>
    </main>
  )
}
