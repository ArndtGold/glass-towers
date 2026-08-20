import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

test.use({ viewport: { width: 640, height: 360 } })

for (const [name, query] of [['auto', ''], ['forced-webgl2', '&renderer=webgl2']] as const) {
  test(`${name} stays responsive with 20 physics bodies`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/?stress=20&seed=152${query}`)
    const canvas = page.getByLabel('Glass Towers game canvas')
    await expect(canvas).toHaveAttribute('data-stress-pieces', '20')
    await expect(canvas).toHaveAttribute('data-stress-p95-work', /\d/, { timeout: 30_000 })
    const samples = Number(await canvas.getAttribute('data-stress-samples'))
    const p95Frame = Number(await canvas.getAttribute('data-stress-p95-frame'))
    const p95Work = Number(await canvas.getAttribute('data-stress-p95-work'))
    expect(samples).toBeGreaterThan(10)
    expect(p95Work).toBeLessThanOrEqual(33.3)
    expect(errors, errors.join('\n')).toEqual([])
    await writeFile(
      `.agdf/control/artefacts/glass-towers/evidence/performance-${name}.json`,
      `${JSON.stringify({ viewport: '640x360', bodies: 20, duration_ms: 10_000, samples, p95_frame_ms: p95Frame, p95_work_ms: p95Work }, null, 2)}\n`,
    )
  })
}
