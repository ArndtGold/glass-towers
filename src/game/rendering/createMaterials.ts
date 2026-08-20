import {
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  EquirectangularReflectionMapping,
  LinearFilter,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  type Material,
} from 'three'
import type { RendererBackend } from '../types'

export type GalleryQualityProfile = 'high' | 'compatible'
export type GalleryMaterialRole = 'floor' | 'mineral' | 'accent' | 'pedestal' | 'lightPanel' | 'softShadow'

export interface GalleryMaterialDiagnostics {
  profile: GalleryQualityProfile
  materialCount: number
  textureCount: number
  textureBytes: number
  surfaceTextureSize: number
}

export interface GalleryMaterialSet {
  profile: GalleryQualityProfile
  materials: Record<GalleryMaterialRole, Material>
  environment: DataTexture
  diagnostics: GalleryMaterialDiagnostics
  dispose: () => void
}

const byteNoise = (x: number, y: number, seed: number) => {
  let value = Math.imul(x + seed * 17, 374761393) + Math.imul(y + seed * 31, 668265263)
  value = (value ^ (value >>> 13)) * 1274126177
  return (value ^ (value >>> 16)) & 0xff
}

function dataTexture(
  data: Uint8Array,
  width: number,
  height: number,
  colorSpace: typeof NoColorSpace | typeof SRGBColorSpace = NoColorSpace,
) {
  const texture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType)
  texture.colorSpace = colorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

function createSurfaceTextures(size: number, detail: number) {
  const albedo = new Uint8Array(size * size * 4)
  const roughness = new Uint8Array(size * size * 4)
  const normal = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4
      const broad = byteNoise(Math.floor(x / 7), Math.floor(y / 7), 11)
      const fine = byteNoise(x, y, 29)
      const variation = Math.round(((broad - 128) * 0.055 + (fine - 128) * 0.022) * detail)
      const tone = Math.max(205, Math.min(244, 228 + variation))
      albedo.set([tone, Math.max(0, tone - 2), Math.max(0, tone - 4), 255], offset)

      const rough = Math.max(150, Math.min(250, 218 + Math.round((fine - 128) * 0.12 * detail)))
      roughness.set([rough, rough, rough, 255], offset)

      const left = byteNoise((x - 1 + size) % size, y, 29)
      const right = byteNoise((x + 1) % size, y, 29)
      const up = byteNoise(x, (y - 1 + size) % size, 29)
      const down = byteNoise(x, (y + 1) % size, 29)
      const nx = Math.max(94, Math.min(162, 128 + Math.round((left - right) * 0.09 * detail)))
      const ny = Math.max(94, Math.min(162, 128 + Math.round((up - down) * 0.09 * detail)))
      normal.set([nx, ny, 255, 255], offset)
    }
  }

  const map = dataTexture(albedo, size, size, SRGBColorSpace)
  const roughnessMap = dataTexture(roughness, size, size)
  const normalMap = dataTexture(normal, size, size)
  for (const texture of [map, roughnessMap, normalMap]) {
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(5, 5)
  }
  return { map, roughnessMap, normalMap }
}

function createSoftShadowTexture(size: number) {
  const pixels = new Uint8Array(size * size * 4)
  const center = (size - 1) / 2
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4
      const dx = (x - center) / center
      const dy = (y - center) / center
      const distance = Math.sqrt(dx * dx + dy * dy)
      const value = Math.round(255 * Math.max(0, 1 - distance) ** 2.4)
      pixels.set([value, value, value, 255], offset)
    }
  }
  const texture = dataTexture(pixels, size, size)
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  return texture
}

function createEnvironmentTexture(width: number) {
  const height = Math.max(8, Math.floor(width / 2))
  const pixels = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      const vertical = 1 - y / Math.max(1, height - 1)
      const keyBand = Math.exp(-((x / width - 0.26) ** 2) / 0.012)
      const rimBand = Math.exp(-((x / width - 0.73) ** 2) / 0.02)
      const lift = keyBand * 62 + rimBand * 34 + vertical * 22
      pixels.set(
        [
          Math.min(255, Math.round(118 + lift)),
          Math.min(255, Math.round(113 + lift * 0.94)),
          Math.min(255, Math.round(110 + lift * 0.9)),
          255,
        ],
        offset,
      )
    }
  }
  const texture = dataTexture(pixels, width, height, SRGBColorSpace)
  texture.mapping = EquirectangularReflectionMapping
  return texture
}

export function createGlassMaterial(color: number, backend: RendererBackend) {
  const high = backend === 'webgpu'
  if (!high) {
    return new MeshStandardMaterial({
      color: new Color(color),
      metalness: 0.08,
      roughness: 0.16,
      envMapIntensity: 0.72,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
    })
  }
  return new MeshPhysicalMaterial({
    color: new Color(color),
    metalness: 0.03,
    roughness: 0.08,
    transmission: 0.58,
    thickness: 0.62,
    ior: 1.45,
    clearcoat: 0.28,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.05,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    attenuationColor: new Color(color),
    attenuationDistance: 3.8,
  })
}

export function createGalleryMaterial(color: number, roughness = 0.84) {
  return new MeshStandardMaterial({ color, roughness, metalness: 0.02 })
}

export function createGalleryMaterialSet(profile: GalleryQualityProfile): GalleryMaterialSet {
  const high = profile === 'high'
  const surfaceSize = high ? 128 : 64
  const environmentWidth = high ? 128 : 64
  const shadowSize = high ? 64 : 32
  const surface = createSurfaceTextures(surfaceSize, high ? 1 : 0.66)
  const shadow = createSoftShadowTexture(shadowSize)
  const environment = createEnvironmentTexture(environmentWidth)
  const common = {
    map: surface.map,
    roughnessMap: surface.roughnessMap,
    normalMap: surface.normalMap,
    normalScale: new Vector2(high ? 0.22 : 0.12, high ? 0.22 : 0.12),
  }

  const materials: Record<GalleryMaterialRole, Material> = {
    floor: new MeshStandardMaterial({
      ...common,
      color: 0xc8c1b8,
      roughness: 0.88,
      metalness: 0.01,
      envMapIntensity: high ? 0.48 : 0.34,
    }),
    mineral: new MeshStandardMaterial({
      ...common,
      color: 0xe4ded6,
      roughness: 0.78,
      metalness: 0.015,
      envMapIntensity: high ? 0.58 : 0.4,
    }),
    accent: new MeshStandardMaterial({
      ...common,
      color: 0x8b817b,
      roughness: high ? 0.46 : 0.58,
      metalness: high ? 0.16 : 0.1,
      envMapIntensity: high ? 0.84 : 0.56,
    }),
    pedestal: new MeshPhysicalMaterial({
      ...common,
      color: 0xeee9e3,
      roughness: high ? 0.42 : 0.54,
      metalness: 0.015,
      clearcoat: high ? 0.22 : 0.1,
      clearcoatRoughness: 0.35,
      envMapIntensity: high ? 0.72 : 0.48,
    }),
    lightPanel: new MeshStandardMaterial({
      color: 0xfff5e8,
      roughness: 0.72,
      metalness: 0,
      emissive: new Color(0xffd9bd),
      emissiveIntensity: high ? 1.45 : 0.92,
      toneMapped: true,
    }),
    softShadow: new MeshBasicMaterial({
      color: 0x4a403a,
      alphaMap: shadow,
      transparent: true,
      opacity: high ? 0.2 : 0.15,
      depthWrite: false,
    }),
  }

  const textures = [surface.map, surface.roughnessMap, surface.normalMap, shadow, environment]
  const textureBytes =
    surfaceSize * surfaceSize * 4 * 3 + shadowSize * shadowSize * 4 + environmentWidth * (environmentWidth / 2) * 4
  let disposed = false
  return {
    profile,
    materials,
    environment,
    diagnostics: {
      profile,
      materialCount: Object.keys(materials).length,
      textureCount: textures.length,
      textureBytes,
      surfaceTextureSize: surfaceSize,
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      for (const material of Object.values(materials)) material.dispose()
      for (const texture of textures) texture.dispose()
    },
  }
}
