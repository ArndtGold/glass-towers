import { describe, expect, it } from 'vitest'
import { resolveRendererTestMode } from '../../src/game/testing/rendererStrategy'

describe('resolveRendererTestMode', () => {
  it('exposes deterministic development probes for fallback and failure', () => {
    expect(resolveRendererTestMode('http://localhost/?renderer=webgl2')).toBe('force-webgl2')
    expect(resolveRendererTestMode('http://localhost/?renderer=fail')).toBe('fail-all')
    expect(resolveRendererTestMode('http://localhost/')).toBe('auto')
  })
})
