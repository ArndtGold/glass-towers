import { MeshStandardMaterial, Texture } from 'three'
import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../../src/game/config'
import { createGalleryMaterialSet } from '../../src/game/rendering/createMaterials'

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
