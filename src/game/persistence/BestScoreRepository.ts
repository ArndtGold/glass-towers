const STORAGE_KEY = 'glass-towers.best-score.v1'

export interface BestScoreRepository {
  read: () => number
  write: (value: number) => void
}

export function createBestScoreRepository(storage: Storage | null = globalThis.localStorage ?? null): BestScoreRepository {
  return {
    read: () => {
      if (!storage) return 0
      try {
        const parsed = Number.parseInt(storage.getItem(STORAGE_KEY) ?? '', 10)
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
      } catch {
        return 0
      }
    },
    write: (value) => {
      if (!storage || !Number.isFinite(value) || value < 0) return
      try {
        storage.setItem(STORAGE_KEY, String(Math.floor(value)))
      } catch {
        // Storage may be blocked; the active run remains playable.
      }
    },
  }
}
