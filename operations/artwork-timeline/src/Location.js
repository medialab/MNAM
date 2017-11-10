
import * as THREE from 'three'

class Location {
  constructor (id, total) {
    this.id = id
    this.position = new THREE.Vector3()
    this.rad = 0
    this.count = 0
    this.nodeSize = 10
    this.children = []
    this.total = total

    this.update = this.update.bind(this)
    this.addChildren = this.addChildren.bind(this)
    this.setLayout = this.setLayout.bind(this)
    this.setFinalRad = this.setFinalRad.bind(this)
  }

  addChildren (l) {
    this.children.push(l)
  }

  setFinalRad () {
    const operationCount = this.total + this.children.reduce((a, b) => a + b.total, 0)
    this.finalRad = Math.max(35, Math.sqrt(this.nodeSize / 2 * operationCount))
  }

  setLayout (origin, theta, rad) {
    this.position.copy(origin.add(new THREE.Vector3(Math.cos(theta) * rad, Math.sin(theta) * rad, 0)))
    this.children.forEach(c => {
      c.setLayout (this.position.clone(), 0, 0)
    })

    // if (this.children.length > 0) {
    //   console.log(this.id, this.position)
    // }
    // console.log(this.id, this.position)
  }

  update () {
    this.rad = Math.sqrt(this.nodeSize / 4 * this.count)
    let theta = 0
    this.children.forEach(c => {
      c.update()
      const r = (this.rad + c.rad + 25)
      c.position.copy(this.position.clone().add(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0)))
      theta += Math.PI * 2 / this.children.length
    })
  }
}

export default Location