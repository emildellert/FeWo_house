import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const app = document.querySelector('#app')

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.NoToneMapping
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
app.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xffffff)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.03, 260)
camera.position.set(8, 5.5, 8)
scene.add(camera)

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd9e0e8, 0.5)
scene.add(hemiLight)

const keyLight = new THREE.DirectionalLight(0xffffff, 1.3)
keyLight.position.set(10, 13, 7)
keyLight.castShadow = true
keyLight.shadow.mapSize.set(1024, 1024)
keyLight.shadow.camera.near = 0.5
keyLight.shadow.camera.far = 45
keyLight.shadow.bias = -0.00022
keyLight.shadow.normalBias = 0.02
scene.add(keyLight)
scene.add(keyLight.target)

const fillLight = new THREE.DirectionalLight(0xe2ebff, 0.4)
fillLight.position.set(-8, 6, -7)
scene.add(fillLight)

const warmBounce = new THREE.DirectionalLight(0xfff0dd, 0.2)
warmBounce.position.set(4, 3, -8)
scene.add(warmBounce)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = false
controls.dampingFactor = 0
controls.enableRotate = false
controls.enableZoom = false
controls.enablePan = false
controls.minPolarAngle = 0.22
controls.maxPolarAngle = Math.PI * 0.495
controls.enabled = false

const world = new THREE.Group()
scene.add(world)

const groundRoot = new THREE.Group()
const houseRoot = new THREE.Group()
const carRoot = new THREE.Group()
world.add(groundRoot)
world.add(houseRoot)
world.add(carRoot)

function createSunGlowTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const center = size * 0.5
  const glow = ctx.createRadialGradient(center, center, size * 0.08, center, center, size * 0.5)
  glow.addColorStop(0, 'rgba(255, 255, 238, 1)')
  glow.addColorStop(0.18, 'rgba(255, 226, 146, 0.95)')
  glow.addColorStop(0.44, 'rgba(255, 178, 86, 0.55)')
  glow.addColorStop(1, 'rgba(255, 160, 74, 0)')

  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createSunRaysTexture(size = 512, rayCount = 18) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const center = size * 0.5
  ctx.translate(center, center)

  for (let i = 0; i < rayCount; i += 1) {
    const angle = (i / rayCount) * Math.PI * 2
    const rayLength = size * (i % 2 === 0 ? 0.47 : 0.42)
    const rayWidth = size * (i % 2 === 0 ? 0.05 : 0.032)

    ctx.save()
    ctx.rotate(angle)

    const gradient = ctx.createLinearGradient(0, 0, rayLength, 0)
    gradient.addColorStop(0, 'rgba(255, 210, 120, 0.28)')
    gradient.addColorStop(0.55, 'rgba(255, 188, 85, 0.2)')
    gradient.addColorStop(1, 'rgba(255, 180, 90, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(size * 0.14, -rayWidth * 0.5)
    ctx.lineTo(rayLength, 0)
    ctx.lineTo(size * 0.14, rayWidth * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createStarTexture(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const center = size * 0.5
  const glow = ctx.createRadialGradient(center, center, 0, center, center, size * 0.5)
  glow.addColorStop(0, 'rgba(255, 255, 255, 1)')
  glow.addColorStop(0.28, 'rgba(218, 230, 255, 0.96)')
  glow.addColorStop(1, 'rgba(185, 205, 255, 0)')

  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  ctx.translate(center, center)
  ctx.strokeStyle = 'rgba(210, 225, 255, 0.72)'
  ctx.lineWidth = size * 0.045
  ctx.beginPath()
  ctx.moveTo(-size * 0.2, 0)
  ctx.lineTo(size * 0.2, 0)
  ctx.moveTo(0, -size * 0.2)
  ctx.lineTo(0, size * 0.2)
  ctx.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createSmokeTexture(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const center = size * 0.5
  const puff = ctx.createRadialGradient(center, center, size * 0.08, center, center, size * 0.48)
  puff.addColorStop(0, 'rgba(245, 248, 255, 0.9)')
  puff.addColorStop(0.5, 'rgba(214, 222, 235, 0.58)')
  puff.addColorStop(1, 'rgba(180, 190, 206, 0)')

  ctx.fillStyle = puff
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createSeededRandom(seed = 1) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const sun = new THREE.Group()
sun.position.set(0, 7.2, -0.8)
scene.add(sun)

const sunCore = new THREE.Mesh(
  new THREE.SphereGeometry(0.36, 28, 28),
  new THREE.MeshStandardMaterial({
    color: 0xffde86,
    emissive: 0xffab4f,
    emissiveIntensity: 1.3,
    roughness: 0.28,
    metalness: 0,
    toneMapped: false,
  }),
)
sun.add(sunCore)

const sunGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createSunGlowTexture(),
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }),
)
sunGlow.scale.set(3.4, 3.4, 1)
sun.add(sunGlow)

const sunRays = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createSunRaysTexture(),
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }),
)
sunRays.scale.set(4.9, 4.9, 1)
sun.add(sunRays)

const sunLight = new THREE.PointLight(0xffbf66, 0.52, 56, 2)
sun.add(sunLight)

const sunMotion = {
  basePosition: new THREE.Vector3(0, 7.2, -0.8),
  amplitude: 0.34,
  speed: 0.22,
}

const moon = new THREE.Group()
moon.position.copy(sunMotion.basePosition)
scene.add(moon)

const moonCore = new THREE.Mesh(
  new THREE.SphereGeometry(0.29, 24, 24),
  new THREE.MeshStandardMaterial({
    color: 0xe9f0ff,
    emissive: 0x7f93b8,
    emissiveIntensity: 0.55,
    roughness: 0.36,
    metalness: 0.02,
    toneMapped: false,
  }),
)
moon.add(moonCore)

const moonGlow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: createSunGlowTexture(384),
    color: 0x9fb6de,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }),
)
moonGlow.scale.set(2.85, 2.85, 1)
moon.add(moonGlow)

const moonLight = new THREE.PointLight(0xafc5ef, 0, 46, 2)
moon.add(moonLight)

const random = createSeededRandom(9417)
const starConfigs = Array.from({ length: 16 }, () => {
  const angle = random() * Math.PI * 2
  const radius = 1.35 + random() * 3.8
  const y = 0.16 + random() * 1.95
  const z = (random() - 0.5) * 0.74

  return {
    offset: new THREE.Vector3(Math.cos(angle) * radius, y, z),
    scale: 0.055 + random() * 0.088,
    speed: 1.35 + random() * 2.8,
    twinkleAmplitude: 0.12 + random() * 0.24,
    twinklePhase: random() * Math.PI * 2,
  }
})

const stars = new THREE.Group()
scene.add(stars)
const starsTexture = createStarTexture()
const starSprites = starConfigs.map((config, index) => {
  const star = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: starsTexture,
      color: 0xdfebff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  )
  star.position.copy(config.offset)
  star.scale.set(config.scale, config.scale, 1)
  star.userData = {
    speed: config.speed,
    phase: index * 0.83 + config.twinklePhase,
    baseScale: config.scale,
    twinkleAmplitude: config.twinkleAmplitude,
  }
  stars.add(star)
  return star
})

const smokeRoot = new THREE.Group()
scene.add(smokeRoot)
const smokeTexture = createSmokeTexture()
const smokeParticles = Array.from({ length: 10 }, (_, index) => {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: smokeTexture,
      color: 0xd5dbe6,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    }),
  )
  sprite.scale.set(0.3, 0.3, 1)
  smokeRoot.add(sprite)
  return {
    sprite,
    driftX: (index - 4.5) * 0.028,
    driftZ: Math.sin(index * 1.27) * 0.033,
    phaseOffset: index / 10,
  }
})

function createNightLamp({ bulbRadius, lightDistance, maxIntensity, color = 0xffc982 }) {
  const group = new THREE.Group()
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(bulbRadius, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0x5a4633,
      emissive: color,
      emissiveIntensity: 0,
      roughness: 0.22,
      metalness: 0.1,
      toneMapped: false,
    }),
  )
  bulb.castShadow = false
  bulb.receiveShadow = false
  group.add(bulb)

  const light = new THREE.PointLight(color, 0, lightDistance, 2)
  light.castShadow = false
  group.add(light)

  scene.add(group)
  return { group, bulb, light, maxIntensity }
}

const garageLamp = createNightLamp({
  bulbRadius: 0.078,
  lightDistance: 3.6,
  maxIntensity: 1.02,
})
const doorLamp = createNightLamp({
  bulbRadius: 0.065,
  lightDistance: 2.9,
  maxIntensity: 0.82,
})
const pathLamps = Array.from({ length: 4 }, () => createNightLamp({
  bulbRadius: 0.042,
  lightDistance: 1.55,
  maxIntensity: 0.4,
}))

const windowGlowRoot = new THREE.Group()
windowGlowRoot.visible = false
scene.add(windowGlowRoot)
const windowGlows = Array.from({ length: 4 }, () => {
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.32),
    new THREE.MeshBasicMaterial({
      color: 0xffdf99,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  )
  glow.visible = false
  windowGlowRoot.add(glow)
  return { glow }
})

const loopPhases = {
  duration: 5.8,
  carInStart: 0.08,
  carInEnd: 0.3,
  sunsetEnd: 0.5,
  nightHoldEnd: 0.7,
  sunriseEnd: 0.84,
  carOutEnd: 0.97,
}

const dayLightLevels = {
  hemi: 0.5,
  key: 1.3,
  fill: 0.4,
  bounce: 0.2,
}

const nightLightLevels = {
  hemi: 0.12,
  key: 0.22,
  fill: 0.16,
  bounce: 0.04,
}

const animationState = {
  house: null,
  footprintBounds: null,
  houseBounds: new THREE.Box3(),
  houseSize: new THREE.Vector3(),
  frontWallZ: 0,
  doorX: 0,
  horizonY: 0,
  driveway: null,
  car: null,
  carReady: false,
  carBaseScale: new THREE.Vector3(1, 1, 1),
  carParkedPosition: new THREE.Vector3(),
  carEntryPosition: new THREE.Vector3(),
  carExitPosition: new THREE.Vector3(),
  carParkedRotationY: 0,
  chimneyAnchor: new THREE.Vector3(0, 2.35, -0.6),
  smokeOffset: new THREE.Vector3(-1.35, 0, 0.73),
  chimneyResolved: false,
}

const cameraRig = {
  ready: false,
  target: new THREE.Vector3(),
  baseOffset: new THREE.Vector3(),
  distance: 0,
  mouseTarget: new THREE.Vector2(),
  mouseCurrent: new THREE.Vector2(),
  autoPanSpeed: 0.23,
  autoPanAngle: 0.22,
  autoPanBias: -0.06,
  mousePanAngle: 0.075,
  mouseLift: 0.58,
}

const scratch = {
  vectorA: new THREE.Vector3(),
  vectorB: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  normalMatrix: new THREE.Matrix3(),
}

const cameraPanAxis = new THREE.Vector3(0, 1, 0)

const loader = new GLTFLoader()
const clock = new THREE.Clock()
const houseModelUrl = `${import.meta.env.BASE_URL}models/cartoon_house.glb`
const carModelUrl = `${import.meta.env.BASE_URL}models/car.glb`

function clearGroup(group) {
  while (group.children.length > 0) {
    group.remove(group.children[0])
  }
}

function getSortedQuantile(sortedValues, t) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1)
  if (sortedValues.length === 0) return 0
  if (sortedValues.length === 1) return sortedValues[0]

  const scaledIndex = clampedT * (sortedValues.length - 1)
  const low = Math.floor(scaledIndex)
  const high = Math.ceil(scaledIndex)
  const blend = scaledIndex - low

  return THREE.MathUtils.lerp(sortedValues[low], sortedValues[high], blend)
}

function normalizeOnGroundAndCenter(model) {
  model.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(model)
  const center = bounds.getCenter(new THREE.Vector3())

  model.position.x -= center.x
  model.position.z -= center.z
  model.position.y -= bounds.min.y

  model.updateMatrixWorld(true)
  const grounded = new THREE.Box3().setFromObject(model)
  model.position.y -= grounded.min.y
}

function scaleModelToFootprint(model, targetFootprint) {
  model.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(model)
  const size = bounds.getSize(new THREE.Vector3())
  const footprint = Math.max(size.x, size.z)

  if (footprint <= 0) return

  const factor = targetFootprint / footprint
  model.scale.multiplyScalar(factor)
}

function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0

  if (d > 0) {
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6
    } else {
      h = ((r - g) / d + 4) / 6
    }
  }

  const s = max === 0 ? 0 : d / max
  const v = max

  return { h, s, v }
}

const recoloredMapCache = new WeakMap()

function recolorHouseTexture(sourceMap) {
  if (!sourceMap || !sourceMap.image) {
    return sourceMap
  }

  if (recoloredMapCache.has(sourceMap)) {
    return recoloredMapCache.get(sourceMap)
  }

  const image = sourceMap.image
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return sourceMap
  }

  ctx.drawImage(image, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const roofAndGarage = new THREE.Color(0x53575d)
  const wallWhite = new THREE.Color(0xf8f4ea)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255

    const { h, s, v } = rgbToHsv(r, g, b)
    const warmHueDist = Math.min(Math.abs(h - 0.075), 1 - Math.abs(h - 0.075))
    const warmHueMask = 1 - THREE.MathUtils.smoothstep(warmHueDist, 0.055, 0.19)
    const warmSatMask = THREE.MathUtils.smoothstep(s, 0.12, 0.86)
    const warmValMask = THREE.MathUtils.smoothstep(v, 0.14, 0.95)
    const roofMask = warmHueMask * warmSatMask * warmValMask

    let nextR = r
    let nextG = g
    let nextB = b

    if (roofMask > 0.01) {
      const shade = THREE.MathUtils.lerp(0.74, 1.08, v)
      const roofR = THREE.MathUtils.clamp(roofAndGarage.r * shade, 0, 1)
      const roofG = THREE.MathUtils.clamp(roofAndGarage.g * shade, 0, 1)
      const roofB = THREE.MathUtils.clamp(roofAndGarage.b * shade, 0, 1)
      const roofBlend = Math.min(1, roofMask * 1.45)

      nextR = THREE.MathUtils.lerp(nextR, roofR, roofBlend)
      nextG = THREE.MathUtils.lerp(nextG, roofG, roofBlend)
      nextB = THREE.MathUtils.lerp(nextB, roofB, roofBlend)
    }

    const neutralSatMask = 1 - THREE.MathUtils.smoothstep(s, 0.2, 0.45)
    const brightMask = THREE.MathUtils.smoothstep(v, 0.6, 0.98)
    const wallMask = neutralSatMask * brightMask * (1 - roofMask)

    if (wallMask > 0.01) {
      const wallBlend = Math.min(1, wallMask * 0.68)
      nextR = THREE.MathUtils.lerp(nextR, wallWhite.r, wallBlend)
      nextG = THREE.MathUtils.lerp(nextG, wallWhite.g, wallBlend)
      nextB = THREE.MathUtils.lerp(nextB, wallWhite.b, wallBlend)
    }

    data[i] = Math.round(nextR * 255)
    data[i + 1] = Math.round(nextG * 255)
    data[i + 2] = Math.round(nextB * 255)
  }

  ctx.putImageData(imageData, 0, 0)

  const recolored = new THREE.CanvasTexture(canvas)
  recolored.colorSpace = THREE.SRGBColorSpace
  recolored.flipY = sourceMap.flipY
  recolored.wrapS = sourceMap.wrapS
  recolored.wrapT = sourceMap.wrapT
  recolored.repeat.copy(sourceMap.repeat)
  recolored.offset.copy(sourceMap.offset)
  recolored.rotation = sourceMap.rotation
  recolored.center.copy(sourceMap.center)
  recolored.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  recolored.needsUpdate = true

  recoloredMapCache.set(sourceMap, recolored)
  return recolored
}

function styleHouseMaterials(house) {
  house.traverse((obj) => {
    if (!obj.isMesh) return

    obj.castShadow = true
    obj.receiveShadow = true

    const sourceMaterials = Array.isArray(obj.material) ? obj.material : [obj.material]
    const styledMaterials = sourceMaterials.map((material) => {
      if (!material) return material

      const next = material.clone()
      next.map = recolorHouseTexture(next.map)
      next.color = new THREE.Color(0xfffdf7)
      next.roughness = 0.87
      next.metalness = 0.04
      next.envMapIntensity = 0.15
      next.needsUpdate = true
      return next
    })

    obj.material = Array.isArray(obj.material) ? styledMaterials : styledMaterials[0]
  })
}

function getLowerFootprintBounds(model) {
  model.updateMatrixWorld(true)
  const fullBounds = new THREE.Box3().setFromObject(model)
  const size = fullBounds.getSize(new THREE.Vector3())
  const yLimit = fullBounds.min.y + size.y * 0.46

  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity
  const xValues = []
  const zValues = []

  const vertex = new THREE.Vector3()

  model.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry || !obj.geometry.attributes.position) return

    const position = obj.geometry.attributes.position

    for (let i = 0; i < position.count; i += 1) {
      vertex.fromBufferAttribute(position, i)
      vertex.applyMatrix4(obj.matrixWorld)

      if (vertex.y > yLimit) continue

      minX = Math.min(minX, vertex.x)
      maxX = Math.max(maxX, vertex.x)
      minZ = Math.min(minZ, vertex.z)
      maxZ = Math.max(maxZ, vertex.z)
      xValues.push(vertex.x)
      zValues.push(vertex.z)
    }
  })

  if (!Number.isFinite(minX) || !Number.isFinite(minZ) || !Number.isFinite(maxX) || !Number.isFinite(maxZ)) {
    return fullBounds.clone()
  }

  if (xValues.length >= 96 && zValues.length >= 96) {
    xValues.sort((a, b) => a - b)
    zValues.sort((a, b) => a - b)

    const trim = 0.02
    const robustMinX = getSortedQuantile(xValues, trim)
    const robustMaxX = getSortedQuantile(xValues, 1 - trim)
    const robustMinZ = getSortedQuantile(zValues, trim)
    const robustMaxZ = getSortedQuantile(zValues, 1 - trim)

    if (robustMaxX > robustMinX && robustMaxZ > robustMinZ) {
      minX = robustMinX
      maxX = robustMaxX
      minZ = robustMinZ
      maxZ = robustMaxZ
    }
  }

  return new THREE.Box3(
    new THREE.Vector3(minX, fullBounds.min.y, minZ),
    new THREE.Vector3(maxX, fullBounds.max.y, maxZ),
  )
}

function buildGroundFromHouse(footprintBounds) {
  clearGroup(groundRoot)

  const footprintSize = footprintBounds.getSize(new THREE.Vector3())
  const frontEdgeZ = footprintBounds.max.z + 0.01
  const backEdgeZ = footprintBounds.min.z
  const garageX = footprintBounds.min.x + footprintSize.x * 0.16
  const doorX = footprintBounds.min.x + footprintSize.x * 0.635

  const drivewayWidth = THREE.MathUtils.clamp(footprintSize.x * 0.34, 2.75, 3.5)
  const drivewayDepth = THREE.MathUtils.clamp(footprintSize.z * 0.84, 3.9, 5.3)
  const pathWidth = 1.02
  const pathDepth = THREE.MathUtils.clamp(drivewayDepth * 0.5, 2.0, 2.65)
  const connectorDepth = 0.82
  const pavementHeight = 0.058
  const houseOverlap = THREE.MathUtils.clamp(footprintSize.z * 0.34, 1.34, 1.72)
  const drivewayNearZ = frontEdgeZ - houseOverlap
  const drivewayFarZ = drivewayNearZ + drivewayDepth
  const pathNearZ = frontEdgeZ + 0.12
  const pathFarZ = pathNearZ + pathDepth

  const pavementMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfd2d6,
    roughness: 0.97,
    metalness: 0,
    envMapIntensity: 0.03,
  })

  const driveway = new THREE.Mesh(
    new RoundedBoxGeometry(drivewayWidth, pavementHeight, drivewayDepth, 4, 0.045),
    pavementMaterial,
  )
  driveway.position.set(garageX, pavementHeight * 0.5 + 0.002, (drivewayNearZ + drivewayFarZ) * 0.5)
  driveway.receiveShadow = true
  groundRoot.add(driveway)

  const frontPath = new THREE.Mesh(
    new RoundedBoxGeometry(pathWidth, pavementHeight * 0.92, pathDepth, 4, 0.045),
    pavementMaterial,
  )
  frontPath.position.set(
    doorX,
    pavementHeight * 0.46 + 0.002,
    (pathNearZ + pathFarZ) * 0.5,
  )
  frontPath.receiveShadow = true
  groundRoot.add(frontPath)

  const drivewayInnerEdgeX = garageX + drivewayWidth * 0.5
  const doorConnectionX = doorX - pathWidth * 0.04
  const connectorWidth = Math.max(pathWidth + 0.24, Math.abs(doorConnectionX - drivewayInnerEdgeX) + pathWidth)
  const connectorX = (doorConnectionX + drivewayInnerEdgeX) * 0.5
  const connectorZ = pathFarZ - connectorDepth * 0.5

  const connectorPath = new THREE.Mesh(
    new RoundedBoxGeometry(connectorWidth, pavementHeight * 0.92, connectorDepth, 4, 0.045),
    pavementMaterial,
  )
  connectorPath.position.set(
    connectorX,
    pavementHeight * 0.46 + 0.002,
    connectorZ,
  )
  connectorPath.receiveShadow = true
  groundRoot.add(connectorPath)

  const drivewayMinX = garageX - drivewayWidth * 0.5
  const drivewayMaxX = garageX + drivewayWidth * 0.5
  const pathMinX = doorX - pathWidth * 0.5
  const pathMaxX = doorX + pathWidth * 0.5
  const connectorMinX = connectorX - connectorWidth * 0.5
  const connectorMaxX = connectorX + connectorWidth * 0.5
  const pavedNearZ = Math.min(drivewayNearZ, pathNearZ, connectorZ - connectorDepth * 0.5)
  const pavedFarZ = Math.max(pathFarZ, connectorZ + connectorDepth * 0.5)
  const drivewayFrontPad = 0.04

  const grassMinX = Math.min(footprintBounds.min.x, drivewayMinX, pathMinX, connectorMinX) - 0.96
  const grassMaxX = Math.max(footprintBounds.max.x, drivewayMaxX, pathMaxX, connectorMaxX) + 0.96
  const grassMinZ = Math.min(backEdgeZ - 1.12, pavedNearZ - 0.48)
  const grassMaxZ = Math.max(drivewayFarZ + drivewayFrontPad, pavedFarZ + 0.28)
  const requiredGrassWidth = grassMaxX - grassMinX
  const requiredGrassDepth = grassMaxZ - grassMinZ
  const grassWidth = Math.max(8.8, requiredGrassWidth)
  const grassDepth = Math.max(8.8, requiredGrassDepth)
  let finalGrassMinX = grassMinX
  let finalGrassMaxX = grassMaxX
  let finalGrassMinZ = grassMinZ
  let finalGrassMaxZ = grassMaxZ

  if (grassWidth > requiredGrassWidth) {
    const extra = grassWidth - requiredGrassWidth
    finalGrassMinX -= extra * 0.5
    finalGrassMaxX += extra * 0.5
  }

  if (grassDepth > requiredGrassDepth) {
    const extra = grassDepth - requiredGrassDepth
    finalGrassMinZ -= extra
  }

  const grassHeight = 0.78

  const grass = new THREE.Mesh(
    new RoundedBoxGeometry(grassWidth, grassHeight, grassDepth, 8, 0.62),
    new THREE.MeshStandardMaterial({
      color: 0x86b96a,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.03,
    }),
  )
  grass.position.set((finalGrassMinX + finalGrassMaxX) * 0.5, -grassHeight * 0.5, (finalGrassMinZ + finalGrassMaxZ) * 0.5)
  grass.receiveShadow = true
  groundRoot.add(grass)

  return {
    x: garageX,
    z: (drivewayNearZ + drivewayFarZ) * 0.5,
    width: drivewayWidth,
    depth: drivewayDepth,
    topY: pavementHeight + 0.002,
  }
}

function styleCarMaterials(car) {
  car.traverse((obj) => {
    if (!obj.isMesh) return

    const sourceMaterials = Array.isArray(obj.material) ? obj.material : [obj.material]
    const styledMaterials = sourceMaterials.map((material) => {
      if (!material) return material

      const name = (material.name || '').toLowerCase()

      if (name.includes('tire')) {
        return new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.95, metalness: 0.02 })
      }

      if (name.includes('rim')) {
        return new THREE.MeshStandardMaterial({ color: 0xa3aab4, roughness: 0.3, metalness: 0.88 })
      }

      if (name.includes('window')) {
        return new THREE.MeshPhysicalMaterial({
          color: 0x95abc2,
          roughness: 0.14,
          metalness: 0,
          transmission: 0.62,
          thickness: 0.03,
          ior: 1.44,
          transparent: true,
          opacity: 0.85,
          envMapIntensity: 0.2,
        })
      }

      if (name.includes('car')) {
        return new THREE.MeshPhysicalMaterial({
          color: 0x2d3440,
          roughness: 0.24,
          metalness: 0.66,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          envMapIntensity: 0.25,
        })
      }

      return new THREE.MeshStandardMaterial({ color: 0x5d646f, roughness: 0.46, metalness: 0.38 })
    })

    obj.material = Array.isArray(obj.material) ? styledMaterials : styledMaterials[0]
    obj.castShadow = true
    obj.receiveShadow = true
  })
}

function placeCarOnDriveway(car, driveway) {
  car.rotation.set(0, 0, 0)
  car.position.set(0, 0, 0)
  car.scale.set(1, 1, 1)

  normalizeOnGroundAndCenter(car)

  const baseBounds = new THREE.Box3().setFromObject(car)
  const baseSize = baseBounds.getSize(new THREE.Vector3())

  const longestAxisIsX = baseSize.x >= baseSize.z
  car.rotation.y = longestAxisIsX ? Math.PI * 0.5 : 0

  car.updateMatrixWorld(true)
  const orientedSize = new THREE.Box3().setFromObject(car).getSize(new THREE.Vector3())
  const orientedLength = Math.max(orientedSize.x, orientedSize.z)
  const orientedWidth = Math.min(orientedSize.x, orientedSize.z)

  const targetLength = driveway.depth * 0.79
  const targetWidth = driveway.width * 0.83
  const scaleFactor = Math.min(targetLength / orientedLength, targetWidth / orientedWidth)
  car.scale.multiplyScalar(scaleFactor)

  normalizeOnGroundAndCenter(car)

  car.position.x = driveway.x
  car.position.z = driveway.z + driveway.depth * 0.14

  car.updateMatrixWorld(true)

  const drivewayLeft = driveway.x - driveway.width * 0.5 + 0.08
  const drivewayRight = driveway.x + driveway.width * 0.5 - 0.08
  const drivewayNear = driveway.z - driveway.depth * 0.5 + 0.08
  const drivewayFar = driveway.z + driveway.depth * 0.5 - 0.08

  const bounds = new THREE.Box3().setFromObject(car)

  if (bounds.min.x < drivewayLeft) {
    car.position.x += drivewayLeft - bounds.min.x
  }
  if (bounds.max.x > drivewayRight) {
    car.position.x -= bounds.max.x - drivewayRight
  }
  if (bounds.min.z < drivewayNear) {
    car.position.z += drivewayNear - bounds.min.z
  }
  if (bounds.max.z > drivewayFar) {
    car.position.z -= bounds.max.z - drivewayFar
  }

  car.updateMatrixWorld(true)
  const corrected = new THREE.Box3().setFromObject(car)
  car.position.y += driveway.topY + 0.014 - corrected.min.y
}

function segmentProgress(value, start, end) {
  if (value <= start) return 0
  if (value >= end) return 1
  return (value - start) / (end - start)
}

function smoothProgress(value, start, end) {
  return THREE.MathUtils.smoothstep(segmentProgress(value, start, end), 0, 1)
}

function easeOutCubic(t) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1)
  return 1 - (1 - clamped) ** 3
}

function easeInCubic(t) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1)
  return clamped ** 3
}

function findChimneyAnchor(house) {
  const houseBounds = new THREE.Box3().setFromObject(house)
  const size = houseBounds.getSize(new THREE.Vector3())
  const fallback = new THREE.Vector3(
    houseBounds.min.x + size.x * 0.24,
    houseBounds.min.y + size.y * 0.86,
    houseBounds.min.z + size.z * 0.28,
  )

  const minY = houseBounds.min.y + size.y * 0.74
  let highestY = -Infinity
  const topCandidates = []

  house.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry || !obj.geometry.attributes.position) return

    const positionAttr = obj.geometry.attributes.position
    const normalAttr = obj.geometry.attributes.normal
    scratch.normalMatrix.getNormalMatrix(obj.matrixWorld)

    for (let i = 0; i < positionAttr.count; i += 1) {
      scratch.vectorA.fromBufferAttribute(positionAttr, i)
      scratch.vectorA.applyMatrix4(obj.matrixWorld)

      if (scratch.vectorA.y < minY) continue

      if (normalAttr) {
        scratch.normal.fromBufferAttribute(normalAttr, i)
        scratch.normal.applyMatrix3(scratch.normalMatrix).normalize()
        if (scratch.normal.y < 0.86) continue
      }

      highestY = Math.max(highestY, scratch.vectorA.y)
      topCandidates.push({
        x: scratch.vectorA.x,
        y: scratch.vectorA.y,
        z: scratch.vectorA.z,
      })
    }
  })

  if (topCandidates.length === 0 || !Number.isFinite(highestY)) return fallback

  const summitThreshold = highestY - size.y * 0.05
  let sumX = 0
  let sumZ = 0
  let count = 0
  for (const point of topCandidates) {
    if (point.y < summitThreshold) continue
    sumX += point.x
    sumZ += point.z
    count += 1
  }

  if (count === 0) return fallback

  return new THREE.Vector3(sumX / count, highestY + 0.14, sumZ / count)
}

function positionNightLighting() {
  if (!animationState.footprintBounds || !animationState.driveway) return
  const footprint = animationState.footprintBounds
  const driveway = animationState.driveway
  const footprintSize = footprint.getSize(scratch.vectorA)
  const houseBounds = animationState.houseBounds
  const houseSize = animationState.houseSize

  const frontWallZ = footprint.max.z + 0.014
  const doorX = footprint.min.x + footprintSize.x * 0.635
  const pathWidth = 1.02
  const garageX = driveway.x
  const pathNearZ = frontWallZ + 0.12
  const pathDepth = THREE.MathUtils.clamp(driveway.depth * 0.5, 2.0, 2.65)
  const pathFarZ = pathNearZ + pathDepth

  animationState.frontWallZ = frontWallZ
  animationState.doorX = doorX

  garageLamp.group.position.set(
    garageX - driveway.width * 0.2,
    houseBounds.min.y + houseSize.y * 0.39,
    frontWallZ - 0.045,
  )
  doorLamp.group.position.set(
    doorX,
    houseBounds.min.y + houseSize.y * 0.46,
    frontWallZ - 0.045,
  )

  const sideOffset = pathWidth * 0.5 + 0.26
  const cornerInset = 0.15
  const lampCorners = [
    { x: doorX - sideOffset, z: pathNearZ + cornerInset },
    { x: doorX + sideOffset, z: pathNearZ + cornerInset },
    { x: doorX - sideOffset, z: pathFarZ - cornerInset },
    { x: doorX + sideOffset, z: pathFarZ - cornerInset },
  ]

  pathLamps.forEach((lamp, index) => {
    const corner = lampCorners[index]
    lamp.group.position.set(
      corner.x,
      driveway.topY + 0.125,
      corner.z,
    )
  })

  const frontWindowZ = frontWallZ - 0.16
  const xA = footprint.min.x + footprintSize.x * 0.29
  const xB = footprint.min.x + footprintSize.x * 0.76
  const xC = footprint.min.x + footprintSize.x * 0.49
  const lowerY = houseBounds.min.y + houseSize.y * 0.36
  const upperY = houseBounds.min.y + houseSize.y * 0.53

  const placements = [
    { x: xA, y: lowerY, z: frontWindowZ, sx: 0.5, sy: 0.33 },
    { x: xB, y: lowerY, z: frontWindowZ, sx: 0.5, sy: 0.33 },
    { x: xC, y: upperY, z: frontWindowZ, sx: 0.45, sy: 0.29 },
    { x: xA + 0.03, y: upperY + 0.06, z: frontWindowZ, sx: 0.4, sy: 0.27 },
  ]

  windowGlows.forEach((entry, index) => {
    const placement = placements[index]
    entry.glow.position.set(placement.x, placement.y, placement.z)
    entry.glow.scale.set(placement.sx, placement.sy, 1)
    entry.glow.rotation.set(0, 0, 0)
  })
}

function updateNightLighting(nightMix, elapsed) {
  const warmMix = smoothProgress(nightMix, 0.04, 0.88)
  const ambientPulse = 0.94 + Math.sin(elapsed * 3.4) * 0.06
  const lampsVisible = warmMix > 0.03

  const practicals = [garageLamp, doorLamp, ...pathLamps]
  practicals.forEach((lamp, index) => {
    lamp.group.visible = lampsVisible
    lamp.bulb.visible = lampsVisible
    if (!lampsVisible) {
      lamp.light.intensity = 0
      lamp.bulb.material.emissiveIntensity = 0
      return
    }

    const flicker = 0.9 + Math.sin(elapsed * (4.6 + index * 0.37) + index * 1.13) * 0.1
    lamp.light.intensity = lamp.maxIntensity * warmMix * flicker * ambientPulse
    lamp.bulb.material.emissiveIntensity = warmMix * (0.42 + lamp.maxIntensity * 0.65)
  })

  windowGlowRoot.visible = false
  windowGlows.forEach((entry) => {
    entry.glow.visible = false
    entry.glow.material.opacity = 0
  })
}

function configureCarLoopState(car, driveway) {
  animationState.car = car
  animationState.driveway = driveway
  animationState.carParkedPosition.copy(car.position)
  animationState.carParkedRotationY = car.rotation.y
  animationState.carBaseScale.copy(car.scale)

  const parkedBounds = new THREE.Box3().setFromObject(car)
  const parkedSize = parkedBounds.getSize(new THREE.Vector3())
  const travelDistance = driveway.depth * 0.98 + Math.max(parkedSize.x, parkedSize.z) * 1.02

  animationState.carEntryPosition.set(
    animationState.carParkedPosition.x,
    animationState.carParkedPosition.y,
    animationState.carParkedPosition.z + travelDistance,
  )
  animationState.carExitPosition.set(
    animationState.carParkedPosition.x,
    animationState.carParkedPosition.y,
    animationState.carEntryPosition.z + driveway.depth * 0.12,
  )

  animationState.carReady = true
  car.visible = false
}

function setCarState(position, rotationY, scaleMultiplier) {
  if (!animationState.carReady || !animationState.car) return

  const car = animationState.car
  const clampedScale = Math.max(0, scaleMultiplier)
  if (clampedScale <= 0.025) {
    car.visible = false
    return
  }

  car.visible = true
  car.position.copy(position)
  car.rotation.y = rotationY
  car.scale.copy(animationState.carBaseScale).multiplyScalar(clampedScale)
}

function getNightMix(loopPhase) {
  if (loopPhase < loopPhases.carInEnd) return 0
  if (loopPhase < loopPhases.sunsetEnd) {
    return smoothProgress(loopPhase, loopPhases.carInEnd, loopPhases.sunsetEnd)
  }
  if (loopPhase < loopPhases.nightHoldEnd) return 1
  if (loopPhase < loopPhases.sunriseEnd) {
    return 1 - smoothProgress(loopPhase, loopPhases.nightHoldEnd, loopPhases.sunriseEnd)
  }
  return 0
}

function getSmokeMix(loopPhase) {
  const start = loopPhases.sunsetEnd - 0.05
  const full = loopPhases.sunsetEnd + 0.05
  if (loopPhase < start) return 0
  if (loopPhase < full) return smoothProgress(loopPhase, start, full)
  if (loopPhase < loopPhases.sunriseEnd) return 1
  if (loopPhase < loopPhases.carOutEnd) {
    return 1 - smoothProgress(loopPhase, loopPhases.sunriseEnd, loopPhases.carOutEnd)
  }
  return 0
}

function updateEnvironmentAnchors() {
  if (!animationState.house) return

  animationState.houseBounds.setFromObject(animationState.house)
  if (animationState.houseBounds.isEmpty()) return
  animationState.houseBounds.getSize(animationState.houseSize)

  if (!animationState.chimneyResolved) {
    animationState.chimneyAnchor.copy(findChimneyAnchor(animationState.house))
    animationState.chimneyResolved = true
  }

  animationState.horizonY = animationState.houseBounds.min.y + animationState.houseSize.y * 0.87
  positionNightLighting()
  smokeRoot.position.copy(animationState.chimneyAnchor).add(animationState.smokeOffset)
}

function updateCarLoop(loopPhase) {
  if (!animationState.carReady || !animationState.car) return

  if (loopPhase < loopPhases.carInStart || loopPhase >= loopPhases.carOutEnd) {
    animationState.car.visible = false
    return
  }

  if (loopPhase < loopPhases.carInEnd) {
    const inProgress = easeOutCubic(segmentProgress(loopPhase, loopPhases.carInStart, loopPhases.carInEnd))
    scratch.vectorA.lerpVectors(animationState.carEntryPosition, animationState.carParkedPosition, inProgress)
    const growth = THREE.MathUtils.lerp(0.04, 1, inProgress)
    const bounce = Math.sin(inProgress * Math.PI) * 0.2 * (1 - inProgress * 0.45)
    const overshoot = Math.min(1.12, growth + bounce)
    const settled = THREE.MathUtils.lerp(overshoot, 1, smoothProgress(inProgress, 0.72, 1))
    setCarState(scratch.vectorA, animationState.carParkedRotationY, settled)
    return
  }

  if (loopPhase < loopPhases.sunriseEnd) {
    setCarState(animationState.carParkedPosition, animationState.carParkedRotationY, 1)
    return
  }

  const outProgress = segmentProgress(loopPhase, loopPhases.sunriseEnd, loopPhases.carOutEnd)
  const turnProgress = smoothProgress(outProgress, 0, 0.32)
  const moveProgress = easeInCubic(smoothProgress(outProgress, 0.2, 1))
  scratch.vectorA.lerpVectors(animationState.carParkedPosition, animationState.carExitPosition, moveProgress)

  const rotationY = animationState.carParkedRotationY + turnProgress * Math.PI
  const scaleMultiplier = THREE.MathUtils.lerp(1, 0.02, moveProgress)
  setCarState(scratch.vectorA, rotationY, scaleMultiplier)
}

function updateSmoke(elapsed, smokeMix) {
  smokeRoot.position.copy(animationState.chimneyAnchor).add(animationState.smokeOffset)

  smokeParticles.forEach((particle, index) => {
    const plumePhase = (elapsed * 0.36 + particle.phaseOffset) % 1
    const rise = plumePhase
    const sway = Math.sin(elapsed * 2.1 + index * 1.21 + rise * 6.2) * 0.056
    const depth = Math.cos(elapsed * 1.8 + index * 0.89 + rise * 4.4) * 0.024

    particle.sprite.position.set(
      particle.driftX + sway * (0.31 + rise),
      rise * 1.35,
      particle.driftZ + depth,
    )

    const opacity = smokeMix * Math.sin(Math.PI * rise) * 0.86
    particle.sprite.material.opacity = opacity
    particle.sprite.visible = smokeMix > 0.01

    const size = 0.44 + rise * 0.92
    particle.sprite.scale.set(size * 0.9, size * 1.4, 1)
  })
}

function updateCameraRig(elapsed) {
  if (!cameraRig.ready) return

  cameraRig.mouseCurrent.lerp(cameraRig.mouseTarget, 0.14)

  const autoYaw = cameraRig.autoPanBias + Math.sin(elapsed * cameraRig.autoPanSpeed) * cameraRig.autoPanAngle
  const mouseYaw = cameraRig.mouseCurrent.x * cameraRig.mousePanAngle
  const totalYaw = autoYaw + mouseYaw
  const lift = cameraRig.mouseCurrent.y * cameraRig.mouseLift

  scratch.vectorA.copy(cameraRig.baseOffset)
  scratch.vectorA.applyAxisAngle(cameraPanAxis, totalYaw)

  camera.position.copy(cameraRig.target).add(scratch.vectorA)
  camera.position.y += lift
  camera.lookAt(cameraRig.target.x, cameraRig.target.y + lift * 0.18, cameraRig.target.z)
}

function updateShadowFrustum() {
  const worldBounds = new THREE.Box3().setFromObject(world)
  const size = worldBounds.getSize(new THREE.Vector3())
  const center = worldBounds.getCenter(new THREE.Vector3())

  const half = Math.max(size.x, size.z) * 0.7
  const shadowCamera = keyLight.shadow.camera

  shadowCamera.left = -half
  shadowCamera.right = half
  shadowCamera.top = half
  shadowCamera.bottom = -half
  shadowCamera.near = 0.5
  shadowCamera.far = Math.max(30, size.y * 6)
  shadowCamera.updateProjectionMatrix()

  keyLight.target.position.set(center.x, center.y * 0.5, center.z)
  keyLight.shadow.needsUpdate = true
}

function updateSunAnchor() {
  const worldBounds = new THREE.Box3().setFromObject(world)
  if (worldBounds.isEmpty()) return

  const size = worldBounds.getSize(scratch.vectorA)
  const center = worldBounds.getCenter(scratch.vectorB)

  sunMotion.basePosition.set(
    center.x + size.x * 0.06,
    center.y + size.y * 0.94,
    center.z - size.z * 0.16,
  )
}

function frameScene() {
  const box = new THREE.Box3().setFromObject(world)
  if (box.isEmpty()) return

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const maxDim = Math.max(size.x, size.y, size.z)
  const fitDistance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)))
  const distance = fitDistance * 2.08

  const direction = new THREE.Vector3(1.04, 0.58, 1.0).normalize()
  camera.near = Math.max(0.03, distance / 180)
  camera.far = distance * 120
  camera.updateProjectionMatrix()

  cameraRig.target.set(center.x, center.y + size.y * 0.11, center.z - size.z * 0.03)
  cameraRig.baseOffset.copy(direction).multiplyScalar(distance)
  cameraRig.distance = distance
  cameraRig.ready = true

  camera.position.copy(cameraRig.target).add(cameraRig.baseOffset)
  camera.lookAt(cameraRig.target)

  updateSunAnchor()
  sun.position.copy(sunMotion.basePosition)
  moon.position.copy(sunMotion.basePosition)
  stars.position.copy(sunMotion.basePosition)
  updateEnvironmentAnchors()
  updateShadowFrustum()
}

loader.load(
  houseModelUrl,
  (houseGltf) => {
    const house = houseGltf.scene
    houseRoot.add(house)
    animationState.house = house

    scaleModelToFootprint(house, 8.2)
    normalizeOnGroundAndCenter(house)
    house.position.y += 0.01

    styleHouseMaterials(house)

    const footprintBounds = getLowerFootprintBounds(house)
    const driveway = buildGroundFromHouse(footprintBounds)
    animationState.footprintBounds = footprintBounds.clone()
    animationState.driveway = driveway
    animationState.chimneyResolved = false
    updateEnvironmentAnchors()

    loader.load(
      carModelUrl,
      (carGltf) => {
        const car = carGltf.scene
        carRoot.add(car)

        styleCarMaterials(car)
        placeCarOnDriveway(car, driveway)
        configureCarLoopState(car, driveway)

        frameScene()
      },
      undefined,
      (error) => {
        console.warn('Car konnte nicht geladen werden:', error)
        frameScene()
      },
    )
  },
  undefined,
  (error) => {
    console.error(`Fehler beim Laden von ${houseModelUrl}`, error)
  },
)

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  frameScene()
}

function onPointerMove(event) {
  const x = THREE.MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1)
  const y = THREE.MathUtils.clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1)
  cameraRig.mouseTarget.set(x, y)
}

function onPointerLeave() {
  cameraRig.mouseTarget.set(0, 0)
}

renderer.domElement.addEventListener('pointermove', onPointerMove)
renderer.domElement.addEventListener('pointerleave', onPointerLeave)
renderer.domElement.addEventListener('pointercancel', onPointerLeave)
window.addEventListener('blur', onPointerLeave)
window.addEventListener('resize', onResize)

function animate() {
  requestAnimationFrame(animate)
  const elapsed = clock.getElapsedTime()
  const loopPhase = (elapsed % loopPhases.duration) / loopPhases.duration
  const nightMix = getNightMix(loopPhase)
  const smokeMix = getSmokeMix(loopPhase)

  updateCarLoop(loopPhase)

  const dayCycle = Math.sin(elapsed * sunMotion.speed)
  const sunHide = nightMix
  const sunScale = THREE.MathUtils.lerp(1, 0.02, sunHide)
  const daySunY = sunMotion.basePosition.y + dayCycle * sunMotion.amplitude
  const sunHiddenY = animationState.horizonY - 0.92
  const sunY = THREE.MathUtils.lerp(daySunY, sunHiddenY, smoothProgress(sunHide, 0, 1))

  sun.position.set(
    sunMotion.basePosition.x,
    sunY,
    sunMotion.basePosition.z,
  )
  sun.scale.setScalar(sunScale)
  sun.visible = sunScale > 0.025
  sunRays.material.rotation = elapsed * 0.12
  sunGlow.material.rotation = -elapsed * 0.04
  sunRays.material.opacity = 0.74 * (1 - nightMix)
  sunGlow.material.opacity = 0.92 * (1 - nightMix)
  sunLight.intensity = (0.44 + (dayCycle + 1) * 0.08) * (1 - nightMix)

  const moonShow = nightMix
  const moonScale = THREE.MathUtils.lerp(0.1, 1, moonShow)
  const moonHiddenY = animationState.horizonY - 0.9
  const moonVisibleY = sunMotion.basePosition.y + 0.04
  moon.position.set(
    sunMotion.basePosition.x,
    THREE.MathUtils.lerp(moonHiddenY, moonVisibleY, easeOutCubic(moonShow)),
    sunMotion.basePosition.z,
  )
  moon.scale.setScalar(moonScale)
  moon.visible = moonShow > 0.02
  moonGlow.material.opacity = 0.5 * moonShow
  moonLight.intensity = 0.34 * moonShow

  stars.position.copy(sunMotion.basePosition)
  starSprites.forEach((star, index) => {
    const twinkle = 0.82 + Math.sin(elapsed * star.userData.speed + star.userData.phase) * star.userData.twinkleAmplitude
    star.material.opacity = moonShow * twinkle * 0.8
    const scale = star.userData.baseScale * (0.88 + twinkle * 0.36)
    star.scale.set(scale, scale, 1)
    star.position.copy(starConfigs[index].offset)
  })

  hemiLight.intensity = THREE.MathUtils.lerp(dayLightLevels.hemi, nightLightLevels.hemi, nightMix)
  keyLight.intensity = THREE.MathUtils.lerp(dayLightLevels.key, nightLightLevels.key, nightMix)
  fillLight.intensity = THREE.MathUtils.lerp(dayLightLevels.fill, nightLightLevels.fill, nightMix)
  warmBounce.intensity = THREE.MathUtils.lerp(dayLightLevels.bounce, nightLightLevels.bounce, nightMix)
  updateNightLighting(nightMix, elapsed)

  updateSmoke(elapsed, smokeMix)
  updateCameraRig(elapsed)

  renderer.render(scene, camera)
}

animate()
