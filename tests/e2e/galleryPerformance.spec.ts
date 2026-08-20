import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { GAME_CONFIG } from '../../src/game/config'

const evidenceDirectory = '.agdf/control/artefacts/glass-towers-gallery-environment/evidence'

test.beforeAll(async () => {
  await mkdir(evidenceDirectory, { recursive: true })
})

for (const [mode, query] of [['auto', ''], ['webgl2', '&renderer=webgl2']] as const) {
  test(`gallery ${mode} stays inside static and 20-body budgets`, async ({ playwright, browserName }, testInfo) => {
    const isolatedBrowser = await playwright[browserName].launch()
    const context = await isolatedBrowser.newContext({ viewport: { width: 640, height: 360 } })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      await page.goto(`http://127.0.0.1:4173/?stress=20&seed=152${query}`)
      const canvas = page.getByLabel('Glass Towers game canvas')
      await expect(canvas).toHaveAttribute('data-gallery-ready', 'true')
      await expect(canvas).toHaveAttribute('data-stress-pieces', '20')
      await page.waitForTimeout(1_500)
      await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-640x360-high-build.png` })
      await expect(canvas).toHaveAttribute('data-stress-p95-work', /\d/, { timeout: 30_000 })
      const metrics = await canvas.evaluate((element) => ({
        profile: element.dataset.galleryProfile,
        drawCalls: Number(element.dataset.galleryDrawCalls),
        geometries: Number(element.dataset.galleryGeometries),
        materials: Number(element.dataset.galleryMaterials),
        textureBytes: Number(element.dataset.galleryTextureBytes),
        samples: Number(element.dataset.stressSamples),
        p95Frame: Number(element.dataset.stressP95Frame),
        p95Work: Number(element.dataset.stressP95Work),
      }))
      await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-640x360-high-stress.png` })
      await writeFile(
        `${evidenceDirectory}/performance-${testInfo.project.name}-${mode}.json`,
        `${JSON.stringify({ viewport: '640x360', bodies: 20, duration_ms: 10_000, ...metrics }, null, 2)}\n`,
      )
      if (mode === 'webgl2') expect(metrics.profile).toBe('compatible')
      expect(metrics.samples).toBeGreaterThan(10)
      expect(metrics.p95Work).toBeLessThanOrEqual(33.3)
      expect(metrics.drawCalls).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxDrawCalls)
      expect(metrics.geometries).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxGeometries)
      expect(metrics.materials).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxMaterials)
      expect(metrics.textureBytes).toBeLessThan(GAME_CONFIG.galleryMaxTextureBytes)
      expect(errors, errors.join('\n')).toEqual([])
    } finally {
      await isolatedBrowser.close()
    }
  })
}
