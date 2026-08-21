import {
  Color,
  Fog,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  Vector2,
  type BufferGeometry,
  type Material,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { PieceDefinition } from '../pieces/catalog'
import type { RendererBackend } from '../types'
import { createGalleryEnvironment, type GalleryEnvironmentDiagnostics } from './createGalleryEnvironment'
import { createGalleryMaterialSet, createGlassMaterial, type GalleryMaterialSet } from './createMaterials'
import type { CameraHomeComposition } from '../camera/CameraFramingController'

export const CAMERA_HOME: CameraHomeComposition = {
  position: [7.8, 5.6, 10.8],
  target: [0, 2.2, 0],
}

export interface SceneBundle {
  scene: Scene
  camera: PerspectiveCamera
  cameraHome: CameraHomeComposition
  worldRoot: Group
  createPieceObject: (piece: PieceDefinition, backend: RendererBackend) => Object3D
  configureRendererBackend: (backend: RendererBackend) => void
  getGalleryDiagnostics: () => GalleryEnvironmentDiagnostics
  dispose: () => void
}

const bevelRadius = (dimensions: readonly [number, number, number]) =>
  Math.max(0.015, Math.min(0.045, Math.min(...dimensions) * 0.03))

export function createPieceVisualGeometry(piece: PieceDefinition): BufferGeometry {
  if (piece.geometry === 'cylinder') {
    const [diameter, height] = piece.dimensions
    const radius = diameter / 2
    const halfHeight = height / 2
    const bevel = bevelRadius(piece.dimensions)
    return new LatheGeometry(
      [
        new Vector2(0, -halfHeight),
        new Vector2(radius - bevel, -halfHeight),
        new Vector2(radius, -halfHeight + bevel),
        new Vector2(radius, halfHeight - bevel),
        new Vector2(radius - bevel, halfHeight),
        new Vector2(0, halfHeight),
      ],
      32,
    )
  }
  if (piece.geometry === 'compound') {
    const segments = piece.colliders.map((collider) => {
      const dimensions: [number, number, number] = collider.halfExtents.map((value) => value * 2) as [
        number,
        number,
        number,
      ]
      const value = new RoundedBoxGeometry(...dimensions, 1, bevelRadius(dimensions))
      const [x, y, z] = collider.offset ?? [0, 0, 0]
      value.translate(x, y, z)
      return value
    })
    const merged = mergeGeometries(segments)
    segments.forEach((segment) => segment.dispose())
    if (!merged) throw new Error(`Could not merge visual geometry for piece ${piece.id}`)
    return merged
  }
  const [x, y, z] = piece.dimensions
  return new RoundedBoxGeometry(x, y, z, 1, bevelRadius(piece.dimensions))
}

export function createSceneBundle(aspect: number): SceneBundle {
  const scene = new Scene()
  scene.background = new Color(0xbab5b1)
  scene.fog = new Fog(0xbab5b1, 24, 52)

  const camera = new PerspectiveCamera(36, aspect, 0.1, 80)
  camera.position.set(...CAMERA_HOME.position)
  camera.lookAt(...CAMERA_HOME.target)

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
      material = createGlassMaterial(piece, backend, galleryMaterials.environment)
      materials.set(materialKey, material)
    }
    const mesh = new Mesh(geometry(`piece-${piece.id}`, () => createPieceVisualGeometry(piece)), material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    group.userData.pieceId = piece.id
    return group
  }

  return {
    scene,
    camera,
    cameraHome: CAMERA_HOME,
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
