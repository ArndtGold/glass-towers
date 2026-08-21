import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { GAME_CONFIG } from '../../src/game/config'

const evidenceDirectory = '.agdf/control/artefacts/glass-towers-gallery-environment/evidence'

const failOnBrowserErrors = (page: Page) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors, errors.join('\n')).toEqual([])
}

const waitForScore = async (page: Page, score: string) => {
  await expect.poll(() => page.getByTestId('score').innerText(), { timeout: 45_000 }).toBe(score)
}

const galleryMetrics = async (page: Page) => {
  const canvas = page.getByLabel('Glass Towers game canvas')
  await expect(canvas).toHaveAttribute('data-gallery-ready', 'true')
  return canvas.evaluate((element) => ({
    profile: element.dataset.galleryProfile,
    groups: Number(element.dataset.galleryGroups),
    meshes: Number(element.dataset.galleryMeshes),
    drawCalls: Number(element.dataset.galleryDrawCalls),
    geometries: Number(element.dataset.galleryGeometries),
    materials: Number(element.dataset.galleryMaterials),
    textureBytes: Number(element.dataset.galleryTextureBytes),
  }))
}

const canvasMeanLuminance = async (page: Page) => {
  const canvas = page.getByLabel('Glass Towers game canvas')
  return canvas.evaluate(async (element) => {
    const source = element as HTMLCanvasElement
    return new Promise<number>((resolve) => {
      requestAnimationFrame(() => {
        const probe = document.createElement('canvas')
        probe.width = 32
        probe.height = 18
        const context = probe.getContext('2d', { willReadFrequently: true })
        if (!context) return resolve(0)
        context.drawImage(source, 0, 0, probe.width, probe.height)
        const pixels = context.getImageData(0, 0, probe.width, probe.height).data
        let luminance = 0
        for (let index = 0; index < pixels.length; index += 4) {
          luminance += pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722
        }
        resolve(luminance / (pixels.length / 4))
      })
    })
  })
}

const expectMetricsWithinBudget = (metrics: Awaited<ReturnType<typeof galleryMetrics>>) => {
  expect(metrics.groups).toBeGreaterThanOrEqual(8)
  expect(metrics.meshes).toBeGreaterThanOrEqual(10)
  expect(metrics.drawCalls).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxDrawCalls)
  expect(metrics.geometries).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxGeometries)
  expect(metrics.materials).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxMaterials)
  expect(metrics.textureBytes).toBeLessThan(GAME_CONFIG.galleryMaxTextureBytes)
}

test.beforeAll(async () => {
  await mkdir(evidenceDirectory, { recursive: true })
})

test.setTimeout(360_000)

for (const [mode, query] of [['auto', ''], ['webgl2', '&renderer=webgl2']] as const) {
  test(`gallery ${mode} keeps the complete desktop run and lifecycle`, async ({ page }, testInfo) => {
    const assertNoErrors = failOnBrowserErrors(page)
    const externalGalleryRequests: string[] = []
    page.on('request', (request) => {
      if (!['image', 'media', 'fetch'].includes(request.resourceType())) return
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') externalGalleryRequests.push(request.url())
    })
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto(`/?seed=152${query}`)
    const canvas = page.getByLabel('Glass Towers game canvas')
    const initialMetrics = await galleryMetrics(page)
    expectMetricsWithinBudget(initialMetrics)
    if (mode === 'webgl2') expect(initialMetrics.profile).toBe('compatible')
    await expect.poll(() => canvasMeanLuminance(page), { timeout: 10_000 }).toBeGreaterThan(35)
    expect(await page.locator('canvas').count()).toBe(1)
    await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-1280x720-start.png` })

    for (const score of ['01', '02', '03']) {
      await canvas.click()
      await waitForScore(page, score)
    }
    await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-1280x720-score-3.png` })
    await page.mouse.click(4, 360)
    await expect(page.getByRole('dialog', { name: 'Beautifully unstable.' })).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-1280x720-game-over.png` })
    await page.getByRole('button', { name: 'Build again' }).click()
    await expect(page.getByTestId('score')).toHaveText('00')

    if (mode === 'auto') {
      for (let restart = 0; restart < 2; restart += 1) {
        await page.mouse.click(4, 360)
        await expect(page.getByRole('dialog', { name: 'Beautifully unstable.' })).toBeVisible({ timeout: 20_000 })
        await page.getByRole('button', { name: 'Build again' }).click()
        await expect(page.getByTestId('score')).toHaveText('00')
      }
    }

    expect(await galleryMetrics(page)).toEqual(initialMetrics)
    expect(await page.locator('canvas').count()).toBe(1)
    expect(externalGalleryRequests).toEqual([])
    assertNoErrors()
  })

  test(`gallery ${mode} remains legible on mobile`, async ({ page }, testInfo) => {
    const assertNoErrors = failOnBrowserErrors(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/?seed=152${query}`)
    const canvas = page.getByLabel('Glass Towers game canvas')
    const metrics = await galleryMetrics(page)
    expectMetricsWithinBudget(metrics)
    if (mode === 'webgl2') expect(metrics.profile).toBe('compatible')
    await expect.poll(() => canvasMeanLuminance(page), { timeout: 10_000 }).toBeGreaterThan(35)
    await expect(page.getByTestId('score')).toBeVisible()
    await expect(page.getByTestId('renderer-backend')).toBeVisible()
    await canvas.click()
    await waitForScore(page, '01')
    await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-390x844-score-1.png` })
    assertNoErrors()
  })
}
