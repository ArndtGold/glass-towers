import { Color, MeshStandardMaterial } from 'three'
import type { RendererBackend } from '../types'

export function createGlassMaterial(color: number, backend: RendererBackend) {
  const webGpu = backend === 'webgpu'
  return new MeshStandardMaterial({
    color: new Color(color),
    metalness: webGpu ? 0.16 : 0.08,
    roughness: webGpu ? 0.09 : 0.16,
    transparent: true,
    opacity: webGpu ? 0.54 : 0.64,
    depthWrite: false,
  })
}

export function createGalleryMaterial(color: number, roughness = 0.84) {
  return new MeshStandardMaterial({ color, roughness, metalness: 0.02 })
}
