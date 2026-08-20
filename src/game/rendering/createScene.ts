import {
  AmbientLight,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  Mesh,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SpotLight,
  type BufferGeometry,
  type Material,
} from 'three'
import type { PieceDefinition } from '../pieces/catalog'
import type { RendererBackend } from '../types'
import { createGalleryMaterial, createGlassMaterial } from './createMaterials'

export interface SceneBundle {
  scene: Scene
  camera: PerspectiveCamera
  worldRoot: Group
  createPieceObject: (piece: PieceDefinition, backend: RendererBackend) => Object3D
  dispose: () => void
}

export function createSceneBundle(aspect: number): SceneBundle {
  const scene = new Scene()
  scene.background = new Color(0xe9e4df)
  scene.fog = new Fog(0xe9e4df, 18, 38)

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

  const floorMaterial = createGalleryMaterial(0xded8d1, 0.92)
  const pedestalMaterial = createGalleryMaterial(0xf1eeea, 0.56)
  const backdropMaterial = createGalleryMaterial(0xf3efeb, 0.98)
  const panelMaterial = createGalleryMaterial(0xd8d0ca, 0.9)
  materials.set('gallery-floor', floorMaterial)
  materials.set('gallery-pedestal', pedestalMaterial)
  materials.set('gallery-backdrop', backdropMaterial)
  materials.set('gallery-panel', panelMaterial)

  const floor = new Mesh(geometry('floor', () => new PlaneGeometry(32, 32)), floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.22
  floor.receiveShadow = true
  worldRoot.add(floor)

  const pedestal = new Mesh(geometry('pedestal', () => new BoxGeometry(2.5, 0.42, 2.5)), pedestalMaterial)
  pedestal.position.y = 0
  pedestal.castShadow = true
  pedestal.receiveShadow = true
  worldRoot.add(pedestal)

  const backdrop = new Mesh(geometry('backdrop', () => new PlaneGeometry(22, 15)), backdropMaterial)
  backdrop.position.set(0, 6.2, -6.5)
  worldRoot.add(backdrop)

  const leftPanel = new Mesh(geometry('panel', () => new BoxGeometry(3.4, 10, 0.35)), panelMaterial)
  leftPanel.position.set(-7.5, 4.6, -2)
  leftPanel.rotation.y = -0.22
  worldRoot.add(leftPanel)

  const rightPanel = leftPanel.clone()
  rightPanel.position.x = 7.5
  rightPanel.rotation.y = 0.22
  worldRoot.add(rightPanel)

  scene.add(new AmbientLight(0xffffff, 2.05))
  const key = new SpotLight(0xfff7ed, 135, 35, Math.PI / 5, 0.55, 1.4)
  key.position.set(6, 12, 8)
  key.target.position.set(0, 2, 0)
  scene.add(key, key.target)
  const rim = new DirectionalLight(0xb9d8f2, 2.4)
  rim.position.set(-6, 7, -4)
  scene.add(rim)
  const fill = new DirectionalLight(0xffc8d6, 1.7)
  fill.position.set(5, 3, 4)
  scene.add(fill)

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
    dispose: () => {
      geometries.forEach((value) => value.dispose())
      materials.forEach((value) => value.dispose())
      geometries.clear()
      materials.clear()
      scene.clear()
    },
  }
}
