import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  type BufferGeometry,
  type Material,
} from 'three'
import type { PieceDefinition } from '../pieces/catalog'
import type { RendererBackend } from '../types'
import { createGalleryEnvironment, type GalleryEnvironmentDiagnostics } from './createGalleryEnvironment'
import { createGalleryMaterialSet, createGlassMaterial, type GalleryMaterialSet } from './createMaterials'

export interface SceneBundle {
  scene: Scene
  camera: PerspectiveCamera
  worldRoot: Group
  createPieceObject: (piece: PieceDefinition, backend: RendererBackend) => Object3D
  configureRendererBackend: (backend: RendererBackend) => void
  getGalleryDiagnostics: () => GalleryEnvironmentDiagnostics
  dispose: () => void
}

export function createSceneBundle(aspect: number): SceneBundle {
  const scene = new Scene()
  scene.background = new Color(0xbab5b1)
  scene.fog = new Fog(0xbab5b1, 24, 52)

  const camera = new PerspectiveCamera(36, aspect, 0.1, 80)
  camera.position.set(7.8, 5.6, 10.8)
  camera.lookAt(0, 2.2, 0)

  const worldRoot = new Group()
  scene.add(worldRoot)
  const geometries = new Map<string, BufferGeometry>()
  const materials = new Map<string, Material>()

  const geometry = <T extends BufferGeometry>(key: string, create: () => T): T => {
    const existing = geometries.get(key)
    if (existing) return existing as T
    const value = create()
    geometries.set(key, value)
    return value
  }

  let galleryMaterials: GalleryMaterialSet = createGalleryMaterialSet('compatible')
  const gallery = createGalleryEnvironment(geometry, galleryMaterials)
  gallery.root.visible = false
  worldRoot.add(gallery.root)
  scene.environment = null
  scene.add(new HemisphereLight(0xfff8ef, 0x7f8a98, 1.35))
  let configuredBackend: RendererBackend | null = null
  let disposed = false

  const configureRendererBackend = (backend: RendererBackend) => {
    if (disposed || configuredBackend === backend) return
    configuredBackend = backend
    gallery.root.visible = true
    const profile = backend === 'webgpu' ? 'high' : 'compatible'
    gallery.configureProfile(profile)
    if (galleryMaterials.profile === profile) {
      scene.environment = profile === 'high' ? galleryMaterials.environment : null
      return
    }
    const previous = galleryMaterials
    galleryMaterials = createGalleryMaterialSet(profile)
    gallery.applyMaterials(galleryMaterials)
    scene.environment = profile === 'high' ? galleryMaterials.environment : null
    previous.dispose()
  }

  const createPieceObject = (piece: PieceDefinition, backend: RendererBackend) => {
    const group = new Group()
    const materialKey = `glass-${piece.id}-${backend}`
    let material = materials.get(materialKey)
    if (!material) {
      material = createGlassMaterial(piece.color, backend)
      materials.set(materialKey, material)
    }
    if (piece.geometry === 'cylinder') {
      const [x, y] = piece.dimensions
      const mesh = new Mesh(geometry(`piece-${piece.id}`, () => new CylinderGeometry(x / 2, x / 2, y, 32)), material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      group.add(mesh)
    } else if (piece.geometry === 'compound') {
      for (const [index, collider] of piece.colliders.entries()) {
        const [hx, hy, hz] = collider.halfExtents
        const mesh = new Mesh(
          geometry(`piece-${piece.id}-${index}`, () => new BoxGeometry(hx * 2, hy * 2, hz * 2, 2, 2, 2)),
          material,
        )
        const [x, y, z] = collider.offset ?? [0, 0, 0]
        mesh.position.set(x, y, z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        group.add(mesh)
      }
    } else {
      const [x, y, z] = piece.dimensions
      const mesh = new Mesh(geometry(`piece-${piece.id}`, () => new BoxGeometry(x, y, z, 2, 2, 2)), material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      group.add(mesh)
    }
    group.userData.pieceId = piece.id
    return group
  }

  return {
    scene,
    camera,
    worldRoot,
    createPieceObject,
    configureRendererBackend,
    getGalleryDiagnostics: gallery.diagnostics,
    dispose: () => {
      if (disposed) return
      disposed = true
      geometries.forEach((value) => value.dispose())
      materials.forEach((value) => value.dispose())
      galleryMaterials.dispose()
      geometries.clear()
      materials.clear()
      scene.environment = null
      scene.clear()
    },
  }
}
