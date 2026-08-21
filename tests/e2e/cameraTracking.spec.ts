import { expect, test, type Page } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const evidenceRoot = '.agdf/control/artefacts/glass-towers-camera-tracking/evidence'

const failOnBrowserErrors = (page: Page) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors, errors.join('\n')).toEqual([])
}

const cameraValue = (page: Page, key: 'cameraTargetY' | 'cameraDistance' | 'cameraP95Work') =>
  page.getByLabel('Glass Towers game canvas').evaluate((canvas, datasetKey) => {
    const value = Number((canvas as HTMLCanvasElement).dataset[datasetKey])
    return Number.isFinite(value) ? value : Number.NaN
  }, key)

const waitForScore = async (page: Page, score: string) => {
  await expect.poll(() => page.getByTestId('score').innerText(), { timeout: 25_000 }).toBe(score)
}

test.setTimeout(300_000)

test('tracks growth, collapse, and restart without losing the structure', async ({ page }, testInfo) => {
  const assertNoErrors = failOnBrowserErrors(page)
  await page.goto('/?seed=152')
  const canvas = page.getByLabel('Glass Towers game canvas')
  await expect(canvas).toHaveAttribute('data-camera-mode', 'build')

  for (const score of ['01', '02', '03', '04', '05', '06', '07', '08']) {
    await canvas.click()
    await waitForScore(page, score)
  }
  await expect.poll(() => cameraValue(page, 'cameraTargetY')).toBeGreaterThan(2.25)
  const builtTarget = await cameraValue(page, 'cameraTargetY')
  await page.screenshot({ path: `${evidenceRoot}/${testInfo.project.name}-auto-growth.png` })

  await page.mouse.click(4, 360)
  await expect(page.getByRole('dialog', { name: 'Beautifully unstable.' })).toBeVisible({ timeout: 20_000 })
  await expect(canvas).toHaveAttribute('data-camera-mode', 'collapse')
  await expect.poll(() => cameraValue(page, 'cameraTargetY'), { timeout: 6_000 }).toBeLessThan(builtTarget - 0.02)
  await page.screenshot({ path: `${evidenceRoot}/${testInfo.project.name}-auto-collapse.png` })

  await page.getByRole('button', { name: 'Build again' }).click()
  await expect.poll(() => canvas.getAttribute('data-camera-mode')).toBe('restart')
  await expect.poll(() => cameraValue(page, 'cameraTargetY'), { timeout: 30_000 }).toBeLessThan(2.3)
  await page.screenshot({ path: `${evidenceRoot}/${testInfo.project.name}-auto-restart.png` })
  assertNoErrors()
})

test('keeps forced WebGL2 on the same camera path and within the camera work budget', async ({ page }, testInfo) => {
  const assertNoErrors = failOnBrowserErrors(page)
  await page.goto('/?renderer=webgl2&stress=20&seed=152')
  await expect(page.getByTestId('renderer-backend')).toHaveText(/WebGL2/)
  await expect.poll(() => cameraValue(page, 'cameraTargetY'), { timeout: 30_000 }).toBeGreaterThan(2.25)
  await expect.poll(() => cameraValue(page, 'cameraP95Work'), { timeout: 240_000 }).toBeGreaterThanOrEqual(0)
  const timing = await page.getByLabel('Glass Towers game canvas').getAttribute('data-camera-timing')
  const cameraP95 = await cameraValue(page, 'cameraP95Work')
  const cameraSamples = Number(await page.getByLabel('Glass Towers game canvas').getAttribute('data-camera-samples'))
  expect(cameraSamples).toBeGreaterThanOrEqual(300)
  await page.waitForTimeout(1_000)
  expect(Number(await page.getByLabel('Glass Towers game canvas').getAttribute('data-camera-samples'))).toBe(cameraSamples)
  if (timing === 'fine') expect(cameraP95).toBeLessThanOrEqual(0.3)
  else {
    expect(testInfo.project.name).toBe('webkit')
    expect(cameraP95).toBeLessThanOrEqual(1)
  }
  writeFileSync(
    `${evidenceRoot}/${testInfo.project.name}-webgl2-camera-performance.json`,
    `${JSON.stringify({
      browserProject: testInfo.project.name,
      backend: 'webgl2',
      pieces: 20,
      warmupMs: 2_000,
      measurementMs: 10_000,
      samples: cameraSamples,
      cameraP95WorkMs: cameraP95,
      timing,
      hardBudgetEvaluated: timing === 'fine',
    }, null, 2)}\n`,
  )
  expect(await cameraValue(page, 'cameraDistance')).toBeGreaterThan(0)
  await page.screenshot({ path: `${evidenceRoot}/${testInfo.project.name}-webgl2-stress-20.png` })
  assertNoErrors()
})

test('uses the reduced-motion controller in portrait framing', async ({ page }, testInfo) => {
  const assertNoErrors = failOnBrowserErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?renderer=webgl2&stress=12&seed=152')
  const canvas = page.getByLabel('Glass Towers game canvas')
  await expect(canvas).toHaveAttribute('data-camera-mode', 'reduced')
  await expect.poll(() => cameraValue(page, 'cameraTargetY')).toBeGreaterThan(2.2)
  await page.screenshot({ path: `${evidenceRoot}/${testInfo.project.name}-webgl2-portrait-reduced.png` })
  assertNoErrors()
})
