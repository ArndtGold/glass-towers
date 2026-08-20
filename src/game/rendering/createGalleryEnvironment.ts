import {
  BoxGeometry,
  DirectionalLight,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  PlaneGeometry,
  RectAreaLight,
  SpotLight,
  type BufferGeometry,
  type Material,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { GalleryMaterialRole, GalleryMaterialSet } from './createMaterials'

type GeometryFactory = <T extends BufferGeometry>(key: string, create: () => T) => T

interface GalleryRenderable extends Object3D {
  material: Material | Material[]
}

export interface GalleryEnvironmentDiagnostics {
  groupCount: number
  meshCount: number
  drawCallCount: number
  uniqueGeometryCount: number
  materialCount: number
  textureBytes: number
  profile: GalleryMaterialSet['profile']
  roles: string[]
}

export interface GalleryEnvironment {
  root: Group
  applyMaterials: (set: GalleryMaterialSet) => void
  configureProfile: (profile: GalleryMaterialSet['profile']) => void
  diagnostics: () => GalleryEnvironmentDiagnostics
}

const transform = (position: [number, number, number], scale: [number, number, number] = [1, 1, 1]) => {
  const object = new Object3D()
  object.position.set(...position)
  object.scale.set(...scale)
  object.updateMatrix()
  return object.matrix.clone()
}

const setRole = <T extends Object3D>(object: T, role: string) => {
  object.userData.galleryRole = role
  return object
}

export function createGalleryEnvironment(
  geometry: GeometryFactory,
  initialMaterials: GalleryMaterialSet,
): GalleryEnvironment {
  const root = setRole(new Group(), 'environment')
  root.name = 'gallery-environment'

  const floorAndPlinth = setRole(new Group(), 'floor-and-plinth')
  floorAndPlinth.name = 'gallery-floor-and-plinth'
  const rearArchitecture = setRole(new Group(), 'rear-architecture')
  rearArchitecture.name = 'gallery-rear-architecture'
  const sideReturns = setRole(new Group(), 'side-returns')
  sideReturns.name = 'gallery-side-returns'
  const columnsAndReveals = setRole(new Group(), 'columns-and-reveals')
  columnsAndReveals.name = 'gallery-columns-and-reveals'
  const lightPanels = setRole(new Group(), 'light-panels')
  lightPanels.name = 'gallery-light-panels'
  const contactShadows = setRole(new Group(), 'soft-contact-shadows')
  contactShadows.name = 'gallery-soft-contact-shadows'
  const studioLights = setRole(new Group(), 'studio-lights')
  studioLights.name = 'gallery-studio-lights'
  root.add(
    floorAndPlinth,
    rearArchitecture,
    sideReturns,
    columnsAndReveals,
    lightPanels,
    contactShadows,
    studioLights,
  )

  const floor = setRole(
    new Mesh(geometry('gallery-floor-volume', () => new BoxGeometry(26, 0.38, 28)), initialMaterials.materials.floor),
    'floor',
  )
  floor.name = 'gallery-floor-volume'
  floor.position.set(0, -0.41, -3.5)
  floorAndPlinth.add(floor)

  const pedestal = setRole(
    new Mesh(
      geometry('gallery-rounded-pedestal', () => new RoundedBoxGeometry(2.5, 0.42, 2.5, 3, 0.12)),
      initialMaterials.materials.pedestal,
    ),
    'pedestal',
  )
  pedestal.name = 'gallery-pedestal'
  pedestal.position.y = -0.01
  floorAndPlinth.add(pedestal)

  const rearWall = setRole(
    new Mesh(
      geometry('gallery-rear-wall-volume', () => new BoxGeometry(21, 30, 0.65)),
      initialMaterials.materials.mineral,
    ),
    'rear-wall',
  )
  rearWall.name = 'gallery-rear-wall-volume'
  rearWall.position.set(0, 13.5, -9.25)
  rearArchitecture.add(rearWall)

  const rearRecess = setRole(
    new Mesh(
      geometry('gallery-rear-recess', () => new RoundedBoxGeometry(8.4, 25, 0.46, 2, 0.14)),
      initialMaterials.materials.accent,
    ),
    'rear-recess',
  )
  rearRecess.name = 'gallery-rear-recess'
  rearRecess.position.set(0, 12.4, -8.83)
  rearArchitecture.add(rearRecess)

  const innerWall = setRole(
    new Mesh(
      geometry('gallery-inner-wall', () => new RoundedBoxGeometry(7.35, 24, 0.3, 2, 0.1)),
      initialMaterials.materials.mineral,
    ),
    'inner-wall',
  )
  innerWall.name = 'gallery-inner-wall'
  innerWall.position.set(0, 12.35, -8.53)
  rearArchitecture.add(innerWall)

  const returnGeometry = geometry('gallery-side-return', () => new BoxGeometry(0.7, 30, 18))
  const returns = setRole(new InstancedMesh(returnGeometry, initialMaterials.materials.mineral, 2), 'side-return')
  returns.name = 'gallery-side-returns-volume'
  returns.setMatrixAt(0, transform([-10.15, 13.5, -1.25]))
  returns.setMatrixAt(1, transform([10.15, 13.5, -1.25]))
  returns.instanceMatrix.needsUpdate = true
  sideReturns.add(returns)

  const columnGeometry = geometry('gallery-column', () => new RoundedBoxGeometry(0.72, 29, 0.85, 2, 0.09))
  const columns = setRole(new InstancedMesh(columnGeometry, initialMaterials.materials.accent, 6), 'column')
  columns.name = 'gallery-columns'
  ;[-8.35, -5.2, -3.95, 3.95, 5.2, 8.35].forEach((x, index) => {
    columns.setMatrixAt(index, transform([x, 13.1, -8.25]))
  })
  columns.instanceMatrix.needsUpdate = true
  columnsAndReveals.add(columns)

  const revealGeometry = geometry('gallery-reveal', () => new BoxGeometry(2.25, 0.46, 1.05))
  const reveals = setRole(new InstancedMesh(revealGeometry, initialMaterials.materials.accent, 8), 'reveal')
  reveals.name = 'gallery-horizontal-reveals'
  let revealIndex = 0
  for (const x of [-6.75, 6.75]) {
    for (const y of [3.3, 8.2, 13.1, 18]) {
      reveals.setMatrixAt(revealIndex, transform([x, y, -8.05]))
      revealIndex += 1
    }
  }
  reveals.instanceMatrix.needsUpdate = true
  columnsAndReveals.add(reveals)

  const crownGeometry = geometry('gallery-crown', () => new RoundedBoxGeometry(17, 0.68, 1.05, 2, 0.1))
  const crowns = setRole(new InstancedMesh(crownGeometry, initialMaterials.materials.accent, 2), 'crown')
  crowns.name = 'gallery-crown-elements'
  crowns.setMatrixAt(0, transform([0, 24.1, -8.25]))
  crowns.setMatrixAt(1, transform([0, 2.15, -8.25]))
  crowns.instanceMatrix.needsUpdate = true
  columnsAndReveals.add(crowns)

  const panelGeometry = geometry('gallery-light-panel', () => new RoundedBoxGeometry(1.55, 3.4, 0.14, 2, 0.08))
  const panels = setRole(new InstancedMesh(panelGeometry, initialMaterials.materials.lightPanel, 6), 'light-panel')
  panels.name = 'gallery-emissive-light-panels'
  ;[
    [-6.75, 5.75, -7.48],
    [-6.75, 15.55, -7.48],
    [6.75, 5.75, -7.48],
    [6.75, 15.55, -7.48],
    [-2.2, 22.2, -8.18],
    [2.2, 22.2, -8.18],
  ].forEach((position, index) => panels.setMatrixAt(index, transform(position as [number, number, number])))
  panels.instanceMatrix.needsUpdate = true
  lightPanels.add(panels)

  const shadowGeometry = geometry('gallery-soft-shadow-plane', () => new PlaneGeometry(1, 1))
  const shadows = setRole(new InstancedMesh(shadowGeometry, initialMaterials.materials.softShadow, 5), 'soft-shadow')
  shadows.name = 'gallery-contact-shadows'
  shadows.rotation.x = -Math.PI / 2
  shadows.setMatrixAt(0, transform([0, 0, 0], [4.2, 4.2, 1]))
  shadows.setMatrixAt(1, transform([-7.1, -6.5, 0], [3.5, 7.5, 1]))
  shadows.setMatrixAt(2, transform([7.1, -6.5, 0], [3.5, 7.5, 1]))
  shadows.setMatrixAt(3, transform([-4.7, -7.4, 0], [2.5, 3.5, 1]))
  shadows.setMatrixAt(4, transform([4.7, -7.4, 0], [2.5, 3.5, 1]))
  shadows.position.y = -0.205
  shadows.instanceMatrix.needsUpdate = true
  contactShadows.add(shadows)

  const key = new RectAreaLight(0xffe8d1, 9.5, 6, 8)
  key.name = 'gallery-key-area-light'
  key.position.set(4.5, 9.5, 5.5)
  key.lookAt(0, 2.2, 0)
  const fill = new RectAreaLight(0xc9ddf0, 6.2, 5, 7)
  fill.name = 'gallery-fill-area-light'
  fill.position.set(-5.8, 6.7, 1.5)
  fill.lookAt(0, 2.8, -1)
  const top = new SpotLight(0xfff6ea, 68, 32, Math.PI / 4.6, 0.75, 1.25)
  top.name = 'gallery-top-spot'
  top.position.set(0, 13.5, 4)
  top.target.position.set(0, 1.4, 0)
  const compatibleKey = new DirectionalLight(0xffe8d1, 2.4)
  compatibleKey.name = 'gallery-compatible-key-light'
  compatibleKey.position.copy(key.position)
  const compatibleFill = new DirectionalLight(0xc9ddf0, 1.65)
  compatibleFill.name = 'gallery-compatible-fill-light'
  compatibleFill.position.copy(fill.position)
  studioLights.add(key, fill, compatibleKey, compatibleFill, top, top.target)

  const configureProfile = (profile: GalleryMaterialSet['profile']) => {
    const high = profile === 'high'
    key.visible = high
    fill.visible = high
    compatibleKey.visible = !high
    compatibleFill.visible = !high
    top.intensity = high ? 68 : 54
  }
  configureProfile(initialMaterials.profile)

  const renderables: GalleryRenderable[] = []
  root.traverse((object) => {
    if ((object as Mesh).isMesh) renderables.push(object as GalleryRenderable)
  })

  let materials = initialMaterials
  const applyMaterials = (set: GalleryMaterialSet) => {
    materials = set
    configureProfile(set.profile)
    for (const object of renderables) {
      const role = object.userData.galleryRole as string
      const materialRole: GalleryMaterialRole =
        role === 'floor'
          ? 'floor'
          : role === 'pedestal'
            ? 'pedestal'
            : role === 'light-panel'
              ? 'lightPanel'
              : role === 'soft-shadow'
                ? 'softShadow'
                : role === 'rear-wall' || role === 'inner-wall' || role === 'side-return'
                  ? 'mineral'
                  : 'accent'
      object.material = set.materials[materialRole]
    }
  }

  const diagnostics = (): GalleryEnvironmentDiagnostics => {
    const geometries = new Set<string>()
    const roles = new Set<string>()
    let groupCount = 0
    root.traverse((object) => {
      const role = object.userData.galleryRole
      if (typeof role === 'string') roles.add(role)
      if ((object as Group).isGroup) groupCount += 1
      if ((object as Mesh).isMesh) geometries.add((object as Mesh).geometry.uuid)
    })
    return {
      groupCount,
      meshCount: renderables.length,
      drawCallCount: renderables.length,
      uniqueGeometryCount: geometries.size,
      materialCount: materials.diagnostics.materialCount,
      textureBytes: materials.diagnostics.textureBytes,
      profile: materials.profile,
      roles: [...roles].sort(),
    }
  }

  return { root, applyMaterials, configureProfile, diagnostics }
}
