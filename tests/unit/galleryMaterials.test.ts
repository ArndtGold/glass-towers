import { MeshPhysicalMaterial, MeshStandardMaterial, Texture } from 'three'
import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../../src/game/config'
import { PIECE_CATALOG } from '../../src/game/pieces/catalog'
import {
  createGalleryMaterialSet,
  createGlassMaterial,
  deriveGlassOptics,
} from '../../src/game/rendering/createMaterials'

const textureBytes = (texture: Texture) => Array.from((texture.image as { data: Uint8Array }).data)

describe('gallery material profiles', () => {
  it('creates deterministic local maps inside the resource budgets', () => {
    const first = createGalleryMaterialSet('high')
    const second = createGalleryMaterialSet('high')
    const firstFloor = first.materials.floor as MeshStandardMaterial
    const secondFloor = second.materials.floor as MeshStandardMaterial

    expect(first.diagnostics).toMatchObject({ profile: 'high', materialCount: 6, textureCount: 5 })
    expect(first.diagnostics.materialCount).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxMaterials)
    expect(first.diagnostics.textureBytes).toBeLessThan(GAME_CONFIG.galleryMaxTextureBytes)
    expect(textureBytes(firstFloor.map!)).toEqual(textureBytes(secondFloor.map!))
    expect(textureBytes(firstFloor.roughnessMap!)).toEqual(textureBytes(secondFloor.roughnessMap!))
    expect(textureBytes(firstFloor.normalMap!)).toEqual(textureBytes(secondFloor.normalMap!))

    first.dispose()
    second.dispose()
  })

  it('keeps the same material roles while reducing compatible detail', () => {
    const high = createGalleryMaterialSet('high')
    const compatible = createGalleryMaterialSet('compatible')

    expect(Object.keys(high.materials)).toEqual(Object.keys(compatible.materials))
    expect(high.diagnostics.surfaceTextureSize).toBeGreaterThan(compatible.diagnostics.surfaceTextureSize)
    expect(high.diagnostics.textureBytes).toBeGreaterThan(compatible.diagnostics.textureBytes)

    high.dispose()
    compatible.dispose()
  })

  it('derives deterministic bounded optics from the existing piece dimensions', () => {
    const optics = PIECE_CATALOG.map((piece) => deriveGlassOptics(piece))
    const repeated = PIECE_CATALOG.map((piece) => deriveGlassOptics(piece))

    expect(optics.map((entry) => entry.opticalThickness)).toEqual(
      repeated.map((entry) => entry.opticalThickness),
    )
    expect(Math.min(...optics.map((entry) => entry.opticalThickness))).toBeGreaterThanOrEqual(0.28)
    expect(Math.max(...optics.map((entry) => entry.opticalThickness))).toBeLessThanOrEqual(0.72)
    expect(deriveGlassOptics(PIECE_CATALOG[2]).opticalThickness).toBeLessThan(
      deriveGlassOptics(PIECE_CATALOG[3]).opticalThickness,
    )
  })

  it('keeps every calibrated glass tint pair clearly separated', () => {
    const tints = PIECE_CATALOG.map((piece) => deriveGlassOptics(piece).tint.clone().convertLinearToSRGB())
    const distances = tints.flatMap((first, firstIndex) =>
      tints.slice(firstIndex + 1).map((second) =>
        Math.hypot(first.r - second.r, first.g - second.g, first.b - second.b),
      ),
    )

    expect(distances).toHaveLength(10)
    expect(Math.min(...distances)).toBeGreaterThan(0.3)
  })

  it('uses physical transmission for WebGPU without alpha washout', () => {
    const set = createGalleryMaterialSet('high')
    const material = createGlassMaterial(PIECE_CATALOG[0], 'webgpu', set.environment)
    const physical = material as MeshPhysicalMaterial

    expect(physical).toBeInstanceOf(MeshPhysicalMaterial)
    expect(physical).toMatchObject({
      transmission: 0.92,
      opacity: 1,
      transparent: false,
      depthWrite: true,
      metalness: 0,
      dispersion: 0,
    })
    expect(physical.thickness).toBe(deriveGlassOptics(PIECE_CATALOG[0]).opticalThickness)

    material.dispose()
    set.dispose()
  })

  it('binds the compatible environment directly to reflective alpha glass', () => {
    const set = createGalleryMaterialSet('compatible')
    const material = createGlassMaterial(PIECE_CATALOG[1], 'webgl2', set.environment)

    expect(material).toBeInstanceOf(MeshStandardMaterial)
    expect(material).toMatchObject({
      envMap: set.environment,
      envMapIntensity: 1.18,
      transparent: true,
      depthWrite: false,
      metalness: 0,
    })
    expect(material.opacity).toBeGreaterThanOrEqual(0.74)
    expect(material.opacity).toBeLessThanOrEqual(0.82)
    expect('transmission' in material).toBe(false)

    material.dispose()
    set.dispose()
  })

  it('creates bright and dark reflection cards at the approved profile resolutions', () => {
    const high = createGalleryMaterialSet('high')
    const compatible = createGalleryMaterialSet('compatible')
    const highPixels = textureBytes(high.environment)

    expect((high.environment.image as { width: number }).width).toBe(256)
    expect((compatible.environment.image as { width: number }).width).toBe(128)
    expect(Math.min(...highPixels.filter((_, index) => index % 4 !== 3))).toBeLessThanOrEqual(40)
    expect(Math.max(...highPixels.filter((_, index) => index % 4 !== 3))).toBeGreaterThanOrEqual(230)
    expect(high.diagnostics.textureBytes).toBeLessThan(GAME_CONFIG.galleryMaxTextureBytes)

    high.dispose()
    compatible.dispose()
  })

  it('disposes every owned material and texture exactly once', () => {
    const set = createGalleryMaterialSet('compatible')
    const resources = new Set<MaterialOrTexture>(Object.values(set.materials))
    resources.add(set.environment)
    for (const material of Object.values(set.materials)) {
      for (const key of ['map', 'roughnessMap', 'normalMap', 'alphaMap'] as const) {
        const texture = (material as MeshStandardMaterial)[key]
        if (texture) resources.add(texture)
      }
    }
    const disposeCounts = new Map<MaterialOrTexture, number>()
    resources.forEach((resource) => {
      disposeCounts.set(resource, 0)
      resource.addEventListener('dispose', () => disposeCounts.set(resource, (disposeCounts.get(resource) ?? 0) + 1))
    })

    set.dispose()
    set.dispose()

    expect(resources.size).toBe(11)
    expect([...disposeCounts.values()]).toEqual(Array.from({ length: 11 }, () => 1))
  })
})

type MaterialOrTexture = ReturnType<typeof createGalleryMaterialSet>['materials'][keyof ReturnType<
  typeof createGalleryMaterialSet
>['materials']] | Texture
