import { GAME_CONFIG } from '../config'
import type { GameIntent } from '../types'

export class InputController {
  private activePointer: number | null = null
  private keyboardPosition = 0

  constructor(
    private readonly element: HTMLElement,
    private readonly onIntent: (intent: GameIntent) => void,
  ) {}

  start() {
    this.element.addEventListener('pointerdown', this.onPointerDown)
    this.element.addEventListener('pointermove', this.onPointerMove)
    this.element.addEventListener('pointerup', this.onPointerUp)
    this.element.addEventListener('pointercancel', this.onPointerCancel)
    window.addEventListener('keydown', this.onKeyDown)
  }

  stop() {
    this.element.removeEventListener('pointerdown', this.onPointerDown)
    this.element.removeEventListener('pointermove', this.onPointerMove)
    this.element.removeEventListener('pointerup', this.onPointerUp)
    this.element.removeEventListener('pointercancel', this.onPointerCancel)
    window.removeEventListener('keydown', this.onKeyDown)
    this.activePointer = null
  }

  private positionFor(clientX: number) {
    const rect = this.element.getBoundingClientRect()
    const normalized = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1
    return normalized * GAME_CONFIG.horizontalLimit
  }

  private onPointerDown = (event: PointerEvent) => {
    this.activePointer = event.pointerId
    try {
      this.element.setPointerCapture?.(event.pointerId)
    } catch {
      // Synthetic and older touch implementations may not expose an active pointer capture.
    }
    this.keyboardPosition = this.positionFor(event.clientX)
    this.onIntent({ type: 'move', position: this.keyboardPosition })
  }

  private onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== this.activePointer) return
    event.preventDefault()
    this.keyboardPosition = this.positionFor(event.clientX)
    this.onIntent({ type: 'move', position: this.keyboardPosition })
  }

  private onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.activePointer) return
    this.keyboardPosition = this.positionFor(event.clientX)
    this.onIntent({ type: 'move', position: this.keyboardPosition })
    this.onIntent({ type: 'drop' })
    this.activePointer = null
  }

  private onPointerCancel = () => {
    this.activePointer = null
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault()
      this.onIntent({ type: 'drop' })
      return
    }
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      event.preventDefault()
      const direction = event.code === 'ArrowLeft' ? -1 : 1
      this.keyboardPosition = Math.max(
        -GAME_CONFIG.horizontalLimit,
        Math.min(GAME_CONFIG.horizontalLimit, this.keyboardPosition + direction * 0.28),
      )
      this.onIntent({ type: 'move', position: this.keyboardPosition })
      return
    }
    if (event.code === 'KeyR' || event.code === 'Enter') {
      this.keyboardPosition = 0
      this.onIntent({ type: 'restart' })
    }
  }
}
