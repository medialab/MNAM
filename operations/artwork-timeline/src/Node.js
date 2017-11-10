
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
    this.currentLocation = null

    var geometry = new THREE.CircleGeometry( 8, 32 )
    var material = new THREE.MeshBasicMaterial( { color: Math.random()* 0xffffff } )
    this.circle = new THREE.Mesh( geometry, material )
    const theta = Math.random() * Math.PI * 2
    const r = Math.random() * height / 2

    this.position = new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0)
    this.color = new THREE.Color(0x000000)
    this.size = 10

    this.targetColor = this.color.clone()

    this.index = i

    this.acc = new THREE.Vector3()
    this.vel = new THREE.Vector3()
    this.damping = 0.85
    this.attractionToTarget = 0.01
    this.nodeRepulsion = 0.001
    this.active = false
    this.firstRun = true

  }

  update (date, locations, nodes) {


    let latestOperation = null
    this.operations.some(o => {
      if (o.date > date) {
        return true
      } else {
        if (o.opt_branch !== 'unknown') {
          latestOperation = o
          this.active = true
        }
        return false
      }
    })
    
    if (!this.active) return null

    if (latestOperation !== this.currentOperation) {
      if (!this.currentOperation) {
        this.targetColor.setHSL( Math.random(), 1.0, 0.5 )
      }

      let nextLocation = locations.find(l => l.id === latestOperation.opt_branch.split('_')[0])


      if (!!nextLocation && this.locationQueue[this.locationQueue.length - 1] !== nextLocation) {
        
        if (!!this.currentLocation && 
            nextLocation.id.split('_')[0] !== this.currentLocation.id.split('_')[0] &&
            !!this.currentLocation.parent) {
          this.locationQueue.push(this.currentLocation.parent)
        }
        
        this.locationQueue.push(nextLocation)

        if (latestOperation.opt_branch.indexOf('_') > 0) {
          nextLocation = nextLocation.children.find(l => l.id === latestOperation.opt_branch)
          if (!nextLocation) {
            console.log('could not find children location')
          } else {
            this.locationQueue.push(nextLocation)
          }
        }

        // nextLocation.count ++
        // nextLocation.update()

        if (!this.currentOperation) {
          const theta = Math.random() * Math.PI * 2
          const r = nextLocation.rad * (1 + Math.random() * 0.5)
          const offset = new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r)
          this.position.copy(nextLocation.position.clone().add(offset))
        }
      } else {
        console.log('oops', latestOperation.opt_branch)
      }
      this.currentOperation = latestOperation
    }

    nodes.forEach((n, i) => {
      if (this.position.distanceTo(n.position) < this.size / 1.5) {
        const distanceToTarget = this.position.distanceTo(n.position)
        const force = n.position.clone().sub(this.position)
        force.negate()
        force.normalize()
        force.multiplyScalar((this.size - distanceToTarget) * this.nodeRepulsion)
        this.acc.add(force)
      }
    })

    if (this.currentLocation !== this.locationQueue[0]) {
      if (!!this.currentLocation) {
        //this.currentLocation.count--
      }
      this.currentLocation = this.locationQueue[0]
      if (!!this.currentLocation) {
        this.currentLocation.count++
      }
    }

    if (!!this.currentLocation) {
      const distanceToTarget = this.position.distanceTo(this.currentLocation.position)
      if (distanceToTarget > this.currentLocation.rad) {
        const force = this.currentLocation.position.clone().sub(this.position)
        force.normalize()
        force.multiplyScalar(distanceToTarget * this.attractionToTarget)
        this.acc.add(force)
      } else if (this.locationQueue.length > 1) {
        this.currentLocation.count--
        this.locationQueue.shift()
        if (!!this.locationQueue[0]) {
          this.locationQueue[0].count++
        }
      }
    }

    // if (this.currentLocation !== this.locationQueue[0]) {
    //   if (!!this.currentLocation) {
    //     this.currentLocation.count --
    //     this.currentLocation.update()
    //   }
    //   if (!!this.locationQueue[0]) {
    //     this.currentLocation = this.locationQueue[0]
    //     this.currentLocation.count ++
    //     this.currentLocation.update()
    //   }
    // }

    this.vel.add(this.acc)
    this.position.add(this.vel)
    this.acc.set(0, 0, 0)
    this.vel.multiplyScalar(this.damping)

    this.color.lerp(this.targetColor, 0.15)

    this.firstRun = false

    return this.position

  }
}

export default Node