
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
    this.locationQueue = []

    var geometry = new THREE.CircleGeometry( 8, 32 )
    var material = new THREE.MeshBasicMaterial( { color: Math.random()* 0xffffff } )
    this.circle = new THREE.Mesh( geometry, material )
    const theta = Math.random() * Math.PI * 2
    const r = Math.random() * height / 2

    this.position = new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0)
    this.color = new THREE.Color(0x000000)
    this.size = 10

    this.targetPosition = this.position.clone()
    this.targetColor = this.color.clone()

    this.index = i

    this.acc = new THREE.Vector3()
    this.vel = new THREE.Vector3()
    this.damping = 0.85
    this.attractionToTarget = 0.01
    this.nodeRepulsion = 0.001
    this.active = false

  }

  update (date, locations, nodes) {


    let latestOperation = null
    this.operations.some(o => {
      if (o.date > date) {
        return true
      } else {
        latestOperation = o
        this.active = true
        return false
      }
    })
    
    if (!this.active) return null

    if (latestOperation !== this.currentOperation) {
      if (!this.currentOperation) {
        this.targetColor.setHSL( Math.random(), 1.0, 0.5 )
      }
      const nextLocation = locations.find(l => {
        return l.locationId === latestOperation.opt_branch
      })
      if (!!nextLocation) {

        this.locationQueue.push(nextLocation)
        if (!!this.currentOperation) this.currentOperation.count --
        nextLocation.count ++
        
        this.targetPosition.copy(nextLocation.position)
        if (!this.currentOperation) {
          const theta = Math.random() * Math.PI * 2
          const r = Math.sqrt(this.size / 2 * nextLocation.count) * (1 + Math.random() * 0.5)
          const offset = new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r)
          this.position.copy(nextLocation.position.clone().add(offset))
        }
      } else {
        console.log('oops')
      }
      this.currentOperation = latestOperation
    }

    nodes.forEach((n, i) => {
      if (this.position.distanceTo(n.position) < this.size) {
        const distanceToTarget = this.position.distanceTo(n.position)
        const force = n.position.clone().sub(this.position)
        force.negate()
        force.normalize()
        force.multiplyScalar((this.size - distanceToTarget) * this.nodeRepulsion)
        this.acc.add(force)
      }
    })

    if (this.locationQueue.length > 0) {
      const distanceToTarget = this.position.distanceTo(this.locationQueue[0].position)
      if (distanceToTarget > Math.sqrt(this.size / 3 * this.locationQueue[0].count)) {
        const force = this.locationQueue[0].position.clone().sub(this.position)
        force.normalize()
        force.multiplyScalar(distanceToTarget * this.attractionToTarget)
        this.acc.add(force)
      } else {
        this.locationQueue.shift()
      }
    }

    this.vel.add(this.acc)
    this.position.add(this.vel)
    this.acc.set(0, 0, 0)
    this.vel.multiplyScalar(this.damping)

    this.color.lerp(this.targetColor, 0.15)

    return this.position

  }
}

export default Node