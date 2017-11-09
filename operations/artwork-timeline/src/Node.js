
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
    this.currentLocation = null

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

        this.currentLocation = nextLocation
        if (!!this.currentOperation) this.currentOperation.count --
        nextLocation.count ++
        
        this.targetPosition.copy(nextLocation.position)
        if (!this.currentOperation) {
          const theta = Math.random() * Math.PI * 2
          const r = Math.sqrt(this.size / 2 * this.currentLocation.count) * (1 + Math.random() * 0.5)
          const offset = new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r)
          this.position.copy(nextLocation.position.clone().add(offset))
        }
      } else {
        console.log('aga')
        // if (!this.currentOperation) {
        //   console.log('lol')
        //   const defaultLocation = locations.find(l => l.locationId === 'CPINTER_storage')
        //   const theta = Math.random() * Math.PI * 2
        //   // const r = 50 + Math.random() * 50
        //   const r = Math.sqrt(this.size * nextLocation.count) * 1.75
        //   const offset = new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r)
        //   this.position.copy(defaultLocation.position.clone().add(offset))
        // }
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


    const distanceToTarget = this.position.distanceTo(this.targetPosition)
    if (!this.currentLocation || distanceToTarget > Math.sqrt(this.size / 3 * this.currentLocation.count)) {
      const force = this.targetPosition.clone().sub(this.position)
      force.normalize()
      force.multiplyScalar(distanceToTarget * this.attractionToTarget)
      this.acc.add(force)
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