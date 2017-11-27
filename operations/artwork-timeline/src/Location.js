
import * as THREE from 'three'
import displayNames from './displayNames.json'
import { map } from './utils.js'

class Location {
  constructor (id, total) {
    this.id = id
    this.displayName = displayNames[this.id]
    this.position = new THREE.Vector3()
    this.originalPosition = new THREE.Vector3()
    this.rad = 0
    this.count = 0
    this.nodeSize = 10
    this.children = []
    this.total = total

    this.update = this.update.bind(this)
    this.updateGeo = this.updateGeo.bind(this)
    this.addChildren = this.addChildren.bind(this)
    this.setLayout = this.setLayout.bind(this)
    this.setGeoLayout = this.setGeoLayout.bind(this)
    this.setFinalRad = this.setFinalRad.bind(this)

    this.theta = 0
    this.thetaOffset = 0
    this.parent = null

    this.acc = new THREE.Vector3()
    this.vel = new THREE.Vector3()
    this.damping = 0.85
    this.cityRepulsion = 0.01
    this.attractionToTarget = 0.001
  }

  addChildren (l) {
    this.children.push(l)
    l.parent = this
  }

  setFinalRad () {
    const operationCount = this.total + this.children.reduce((a, b) => a + b.total, 0)
    this.finalRad = Math.max(35, Math.sqrt(this.nodeSize / 2 * operationCount))
  }

  setLayout (origin, theta, rad, thetaOffset) {
    this.position.copy(origin.add(new THREE.Vector3(Math.cos(theta) * rad, Math.sin(theta) * rad, 0)))
    
    this.theta = theta
    this.thetaOffset = thetaOffset * 2

    let t = theta - this.thetaOffset / 1.5
    this.children
      .forEach(c => {
        c.setLayout (this.position.clone(), t, 30)
        t += this.thetaOffset / this.children.length
      })
  }

  setGeoLayout (x, y) {
    this.position.set(x, y, 0)
    this.originalPosition.set(x, y, 0)
  }

  update () {
    this.rad = Math.max(this.children.length > 0 ? 35 : 10, Math.sqrt(this.nodeSize / 4 * this.count))
    if (this.children.length > 0) this.rad = 35

    let theta = this.theta - this.thetaOffset / 2

    this.children.forEach(c => {
      theta += this.thetaOffset / this.children.length / 2
      c.update()
      const r = (this.rad + c.rad) * 1.2 + 35
      c.position.copy(this.position.clone().add(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0)))
      theta += this.thetaOffset / this.children.length / 2
    })
  }

  updateGeo (cities) {
    this.rad = Math.max(1, Math.sqrt(this.nodeSize / 4 * this.count))

    if (this.count === 0) return

    cities
      .filter(c => c.count > 0)
      .forEach((c, i) => {
        if (this.position.distanceTo(c.position) < (this.rad + c.rad + 20)) {
          // console.log('aga')
          const distanceToTarget = this.position.distanceTo(c.position)
          const force = c.position.clone().sub(this.position)
          force.negate()
          force.normalize()
          force.multiplyScalar(((this.rad + c.rad + 30) - distanceToTarget) * this.cityRepulsion)
          this.acc.add(force)
        }
      })

    // const attraction = map(Math.sqrt(this.rad), 1, Math.sqrt(50), 0, 0.1)
    // const distanceToCoords = this.position.distanceTo(this.originalPosition)
    // const force = this.originalPosition.clone().sub(this.position)
    // force.normalize()
    // force.multiplyScalar(distanceToCoords * attraction)
    // this.acc.add(force)

    this.vel.add(this.acc)
    this.position.add(this.vel)
    this.acc.set(0, 0, 0)
    this.vel.multiplyScalar(this.damping)

  }
}

export default Location