
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

  }

  update (date, locations) {
    // for (let i = this.operationIndex; i < this.operations.length; i++) {

    // }
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

    this.position.lerp(this.targetPosition, 0.15)

  }
}

export default Node