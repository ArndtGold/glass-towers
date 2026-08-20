import { afterEach, describe, expect, it, vi } from 'vitest'
import { InputController } from '../../src/game/input/InputController'

describe('InputController', () => {
  afterEach(() => vi.restoreAllMocks())

  it('maps keyboard movement, drop, and restart to intents', () => {
    const element = document.createElement('canvas')
    const onIntent = vi.fn()
    const controller = new InputController(element, onIntent)
    controller.start()

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }))

    expect(onIntent.mock.calls.map(([intent]) => intent)).toEqual([
      { type: 'move', position: 0.28 },
      { type: 'move', position: 0.56 },
      { type: 'drop' },
      { type: 'restart' },
    ])
    controller.stop()
  })
})
