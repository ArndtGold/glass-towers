import { expect, test, type Page } from '@playwright/test'

const failOnBrowserErrors = (page: Page) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors, errors.join('\n')).toEqual([])
}

const waitForScore = async (page: Page, score: string) => {
  await expect.poll(() => page.getByTestId('score').innerText(), { timeout: 25_000 }).toBe(score)
}

test.setTimeout(120_000)

test('auto backend supports scoring, failure, best score, and restart', async ({ page }) => {
  const assertNoErrors = failOnBrowserErrors(page)
  await page.goto('/?seed=152')
  await expect(page.getByText(/Web(?:GPU|GL2) ·/)).toBeVisible()
  const canvas = page.getByLabel('Glass Towers game canvas')

  for (const score of ['01', '02', '03']) {
    await canvas.click()
    await waitForScore(page, score)
  }
  await page.screenshot({ path: '.agdf/control/artefacts/glass-towers/evidence/auto-score-3.png' })
  await page.mouse.click(4, 360)
  await expect(page.getByRole('dialog', { name: 'Beautifully unstable.' })).toBeVisible({ timeout: 20_000 })
  await page.screenshot({ path: '.agdf/control/artefacts/glass-towers/evidence/auto-game-over.png' })
  await page.getByRole('button', { name: 'Build again' }).click()
  await expect(page.getByTestId('score')).toHaveText('00')
  await expect(page.getByTestId('best-score')).toHaveText('03')
  await page.reload()
  await expect(page.getByTestId('best-score')).toHaveText('03')
  assertNoErrors()
})

test('forced WebGL2 keeps the complete core loop', async ({ page }) => {
  const assertNoErrors = failOnBrowserErrors(page)
  await page.goto('/?renderer=webgl2&seed=152')
  await expect(page.getByTestId('renderer-backend')).toHaveText(/WebGL2/)
  const canvas = page.getByLabel('Glass Towers game canvas')
  await canvas.click()
  await waitForScore(page, '01')
  await canvas.click()
  await waitForScore(page, '02')
  await page.screenshot({ path: '.agdf/control/artefacts/glass-towers/evidence/webgl2-score-2.png' })
  await page.mouse.click(1275, 360)
  await expect(page.getByRole('dialog', { name: 'Beautifully unstable.' })).toBeVisible({ timeout: 20_000 })
  await page.keyboard.press('r')
  await expect(page.getByTestId('score')).toHaveText('00')
  assertNoErrors()
})

test('renderer failure ends in visible, controlled recovery', async ({ page }) => {
  const assertNoErrors = failOnBrowserErrors(page)
  await page.goto('/?renderer=fail')
  await expect(page.getByRole('alert', { name: 'This sculpture needs WebGPU or WebGL2.' })).toBeVisible()
  await page.screenshot({ path: '.agdf/control/artefacts/glass-towers/evidence/renderer-failure.png' })
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('alert', { name: 'This sculpture needs WebGPU or WebGL2.' })).toBeVisible()
  assertNoErrors()
})

test('mouse, touch pointer, and keyboard share the drop intent', async ({ page }) => {
  const assertNoErrors = failOnBrowserErrors(page)
  await page.goto('/?seed=152')
  const canvas = page.getByLabel('Glass Towers game canvas')
  await canvas.click()
  await waitForScore(page, '01')
  await canvas.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: 640, clientY: 360 })
  await canvas.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', clientX: 640, clientY: 360 })
  await waitForScore(page, '02')
  await page.keyboard.press('Space')
  await waitForScore(page, '03')
  assertNoErrors()
})
