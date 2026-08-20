import { describe, expect, it } from 'vitest'
import { createBestScoreRepository } from '../../src/game/persistence/BestScoreRepository'

describe('BestScoreRepository', () => {
  it('reads, validates and writes a numeric score', () => {
    const storage = new Map<string, string>()
    const adapter: Storage = {
      get length() { return storage.size },
      clear: () => storage.clear(),
      getItem: (key) => storage.get(key) ?? null,
      key: (index) => Array.from(storage.keys())[index] ?? null,
      removeItem: (key) => storage.delete(key),
      setItem: (key, value) => storage.set(key, value),
    }
    const repository = createBestScoreRepository(adapter)
    expect(repository.read()).toBe(0)
    repository.write(7.8)
    expect(repository.read()).toBe(7)
    adapter.setItem('glass-towers.best-score.v1', 'broken')
    expect(repository.read()).toBe(0)
  })
})
