import { Mesh, type BufferGeometry } from 'three'
import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../../src/game/config'
import { createGalleryEnvironment } from '../../src/game/rendering/createGalleryEnvironment'
import { createGalleryMaterialSet } from '../../src/game/rendering/createMaterials'
import { createSceneBundle } from '../../src/game/rendering/createScene'

describe('gallery environment', () => {
  it('builds one closed render-only environment without the old backdrop', () => {
    const geometries = new Map<string, BufferGeometry>()
    const materials = createGalleryMaterialSet('compatible')
    const environment = createGalleryEnvironment((key, create) => {
      const existing = geometries.get(key)
      if (existing) return existing as ReturnType<typeof create>
      const value = create()
      geometries.set(key, value)
      return value
    }, materials)
    const diagnostics = environment.diagnostics()
    const roles = new Set(diagnostics.roles)

    expect(environment.root.name).toBe('gallery-environment')
    expect(roles).toEqual(
      expect.objectContaining(
        new Set([
          'floor',
          'pedestal',
          'rear-wall',
          'inner-wall',
          'side-return',
          'column',
          'reveal',
          'light-panel',
          'soft-shadow',
        ]),
      ),
    )
    expect(roles.has('backdrop')).toBe(false)
    expect(diagnostics.uniqueGeometryCount).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxGeometries)
    expect(diagnostics.drawCallCount).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxDrawCalls)
    expect(diagnostics.materialCount).toBeLessThanOrEqual(GAME_CONFIG.galleryMaxMaterials)
    environment.root.traverse((object) => {
      if (!(object as Mesh).isMesh) return
      expect(object.userData.collider).toBeUndefined()
      expect(object.userData.physics).toBeUndefined()
    })

    geometries.forEach((value) => value.dispose())
    materials.dispose()
  })

  it('switches backend profiles once and disposes the full scene idempotently', () => {
    const bundle = createSceneBundle(16 / 9)
    const initialPedestal = bundle.worldRoot.getObjectByName('gallery-pedestal') as Mesh
    const initialMaterial = Array.isArray(initialPedestal.material) ? initialPedestal.material[0] : initialPedestal.material
    let initialMaterialDisposals = 0
    initialMaterial.addEventListener('dispose', () => {
      initialMaterialDisposals += 1
    })

    expect(bundle.worldRoot.getObjectByName('gallery-environment')).toBeDefined()
    expect(bundle.worldRoot.getObjectByName('gallery-environment')?.visible).toBe(false)
    expect(bundle.scene.environment).toBeNull()
    expect(bundle.getGalleryDiagnostics().profile).toBe('compatible')
    bundle.configureRendererBackend('webgpu')
    expect(bundle.worldRoot.getObjectByName('gallery-environment')?.visible).toBe(true)
    const highEnvironment = bundle.scene.environment!
    let highEnvironmentDisposals = 0
    highEnvironment.addEventListener('dispose', () => {
      highEnvironmentDisposals += 1
    })
    expect(bundle.getGalleryDiagnostics().profile).toBe('high')
    expect(initialMaterialDisposals).toBe(1)

    bundle.configureRendererBackend('webgpu')
    expect(bundle.scene.environment).toBe(highEnvironment)
    expect(initialMaterialDisposals).toBe(1)

    bundle.dispose()
    bundle.dispose()
    expect(highEnvironmentDisposals).toBe(1)
    expect(bundle.scene.children).toHaveLength(0)
  })
})
