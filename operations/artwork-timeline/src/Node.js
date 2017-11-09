
import * as THREE from 'three'


class Node {
  constructor (data, scene, width, height, i) {
      
    this.id = data._id
    this.operations = data.operations
      .sort((a, b) => {
        a.date - b.date
      })

    this.update = this.update.bind(this)

    this.currentOperation = null

    var geometry = new THREE.CircleGeometry( 8, 32 )
    var material = new THREE.MeshBasicMaterial( { color: Math.random()* 0xffffff } )
    this.circle = new THREE.Mesh( geometry, material )
    const theta = Math.random() * Math.PI * 2
    const r = Math.random() * height / 2

    this.position = new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0)
    this.color = new THREE.Color()
    this.color.setHSL( Math.random(), 1.0, 0.5 )
    this.size = 10

    this.targetPosition = this.position.clone()

    this.index = i

    this.acc = new THREE.Vector3()
    this.vel = new THREE.Vector3()
    this.damping = 0.85
    this.attractionToTarget = 0.005

  }

  update (date, locations, nodes) {

    let latestOperation = null
    this.operations.some(o => {
      if (o.date > date) {
        return true
      } else {
        latestOperation = o
        return false
      }
    })
    if (latestOperation !== this.currentOperation) {
      this.currentOperation = latestOperation
      const nextLocation = locations.find(l => {
        return l.locationId === this.currentOperation.opt_branch
      })
      if (!!nextLocation) {
        this.targetPosition.copy(nextLocation.position)
      }
    }

    nodes.forEach(n => {
      if (n !== this) {
        if (this.position.distanceTo(n.position) < this.size) {
          const distanceToTarget = this.position.distanceTo(n.position)
          const force = n.position.clone().sub(this.position)
          force.negate()
          force.normalize()
          force.multiplyScalar((this.size - distanceToTarget) * 0.01)
          this.acc.add(force)
        }
      }
    })

    const distanceToTarget = this.position.distanceTo(this.targetPosition)
    const force = this.targetPosition.clone().sub(this.position)
    force.normalize()
    force.multiplyScalar(distanceToTarget * this.attractionToTarget)
    this.acc.add(force)

    this.vel.add(this.acc)
    this.position.add(this.vel)
    this.acc.set(0, 0, 0)
    this.vel.multiplyScalar(this.damping)

    // this.position.lerp(this.targetPosition, 0.15)

  }
}

export default Node