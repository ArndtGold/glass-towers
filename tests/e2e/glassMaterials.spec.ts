import { expect, test, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const evidenceDirectory = '.agdf/control/artefacts/glass-towers-webgpu-glass-materials/evidence'

const failOnBrowserErrors = (page: Page) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors, errors.join('\n')).toEqual([])
}

const glassReadability = (page: Page) =>
  page.getByLabel('Glass Towers game canvas').evaluate(async (element) => {
    const source = element as HTMLCanvasElement
    return new Promise<{ edgeGradient: number; innerOuter: number; chromaVariation: number }>((resolve) => {
      requestAnimationFrame(() => {
        const width = 160
        const height = 90
        const probe = document.createElement('canvas')
        probe.width = width
        probe.height = height
        const context = probe.getContext('2d', { willReadFrequently: true })!
        context.drawImage(source, 0, 0, width, height)
        const pixels = context.getImageData(0, 0, width, height).data
        const luminance = (offset: number) =>
          pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722
        let edge = 0
        let edgeCount = 0
        let innerLuminance = 0
        let innerCount = 0
        let outerLuminance = 0
        let outerCount = 0
        let chroma = 0

        for (let y = 18; y < 72; y += 1) {
          for (let x = 42; x < 118; x += 1) {
            const offset = (y * width + x) * 4
            const value = luminance(offset)
            const inner = x > 55 && x < 105 && y > 25 && y < 64
            if (inner) {
              innerLuminance += value
              innerCount += 1
              chroma += Math.abs(pixels[offset] - pixels[offset + 1])
              chroma += Math.abs(pixels[offset + 1] - pixels[offset + 2])
            } else {
              outerLuminance += value
              outerCount += 1
            }
            if (x < 117 && y < 71) {
              edge += Math.abs(value - luminance(offset + 4))
              edge += Math.abs(value - luminance(offset + width * 4))
              edgeCount += 2
            }
          }
        }

        resolve({
          edgeGradient: edge / edgeCount,
          innerOuter: Math.abs(innerLuminance / innerCount - outerLuminance / outerCount),
          chromaVariation: chroma / innerCount,
        })
      })
    })
  })

const paletteColorDistances = (page: Page) =>
  page.getByLabel('Glass Towers game canvas').evaluate((element) => {
    const source = element as HTMLCanvasElement
    return new Promise<number[]>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const probe = document.createElement('canvas')
        probe.width = 1280
        probe.height = 720
        const context = probe.getContext('2d', { willReadFrequently: true })!
        context.drawImage(source, 0, 0, probe.width, probe.height)
        const samplePoints = [
          [450, 380],
          [526, 405],
          [608, 416],
          [706, 438],
          [785, 470],
        ] as const
        const colors = samplePoints.map(([centerX, centerY]) => {
          const pixels = context.getImageData(centerX - 4, centerY - 4, 9, 9).data
          const channels = [0, 0, 0]
          for (let offset = 0; offset < pixels.length; offset += 4) {
            channels[0] += pixels[offset]
            channels[1] += pixels[offset + 1]
            channels[2] += pixels[offset + 2]
          }
          return channels.map((value) => value / 81)
        })
        resolve(colors.flatMap((first, firstIndex) =>
          colors.slice(firstIndex + 1).map((second) =>
            Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]),
          ),
        ))
      }))
    })
  })

const waitForScore = async (page: Page, score: string) => {
  await expect.poll(() => page.getByTestId('score').innerText(), { timeout: 45_000 }).toBe(score)
}

test.beforeAll(async () => {
  await mkdir(evidenceDirectory, { recursive: true })
})

test.setTimeout(180_000)

for (const [mode, query] of [['auto', ''], ['webgl2', '&renderer=webgl2']] as const) {
  test(`glass materials ${mode} show all five colors together`, async ({ page }, testInfo) => {
    const assertNoErrors = failOnBrowserErrors(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto(`/?seed=152&palette=1${query}`)
    const canvas = page.getByLabel('Glass Towers game canvas')
    await expect(canvas).toHaveAttribute('data-gallery-ready', 'true')
    await expect(canvas).toHaveAttribute('data-palette-pieces', 'prism,pillar,slab,drum,offset')
    const colorDistances = await paletteColorDistances(page)
    expect(colorDistances).toHaveLength(10)
    expect(Math.min(...colorDistances), JSON.stringify(colorDistances)).toBeGreaterThan(28)
    await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-five-colors.png` })
    assertNoErrors()

    await writeFile(
      `${evidenceDirectory}/palette-${testInfo.project.name}-${mode}.json`,
      `${JSON.stringify({ viewport: '1280x720', minimumPairDistance: Math.min(...colorDistances), colorDistances }, null, 2)}\n`,
    )
  })

  test(`glass materials ${mode} preserve readable overlap and lifecycle`, async ({ page }, testInfo) => {
    const assertNoErrors = failOnBrowserErrors(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto(`/?seed=152${query}`)
    const canvas = page.getByLabel('Glass Towers game canvas')
    await expect(canvas).toHaveAttribute('data-gallery-ready', 'true')
    if (mode === 'webgl2') await expect(page.getByTestId('renderer-backend')).toContainText('WebGL2')

    const startMetrics = await glassReadability(page)
    expect(startMetrics.edgeGradient).toBeGreaterThan(5)
    expect(startMetrics.innerOuter).toBeGreaterThan(4)
    expect(startMetrics.chromaVariation).toBeGreaterThan(15)
    await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-start.png` })

    for (const score of ['01', '02', '03']) {
      await canvas.click()
      await waitForScore(page, score)
    }
    const overlapMetrics = await glassReadability(page)
    expect(overlapMetrics.edgeGradient).toBeGreaterThan(5)
    expect(overlapMetrics.innerOuter).toBeGreaterThan(4)
    expect(overlapMetrics.chromaVariation).toBeGreaterThan(15)
    await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-score-3.png` })

    await page.mouse.click(4, 360)
    await expect(page.getByRole('dialog', { name: 'Beautifully unstable.' })).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: `${evidenceDirectory}/${testInfo.project.name}-${mode}-game-over.png` })
    await page.getByRole('button', { name: 'Build again' }).click()
    await expect(page.getByTestId('score')).toHaveText('00')
    expect(await page.locator('canvas').count()).toBe(1)
    assertNoErrors()

    await writeFile(
      `${evidenceDirectory}/readability-${testInfo.project.name}-${mode}.json`,
      `${JSON.stringify({ viewport: '1280x720', seed: 152, start: startMetrics, score3: overlapMetrics }, null, 2)}\n`,
    )
  })
}
