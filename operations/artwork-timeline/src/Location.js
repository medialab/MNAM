
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
  }

  addChildren (l) {
    this.children.push(l)
  }

  setLayout (origin, theta, rad) {
    this.position.copy(origin.add(new THREE.Vector3(Math.cos(theta) * rad, Math.sin(theta) * rad, 0)))
    this.children.forEach(c => {
      c.setLayout (this.position.clone(), 0, 0)
    })

    if (this.children.length > 0) {
      console.log(this.id, this.position)
    }
    // console.log(this.id, this.position)
  }

  update () {
    this.rad = Math.sqrt(this.nodeSize / 2 * this.count)
    let theta = 0
    this.children.forEach(c => {
      c.update()
      const r = (this.rad + c.rad + 25) * 2
      c.position.copy(this.position.clone().add(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0)))
      theta += Math.PI * 2 / this.children.length
    })
  }
}

export default Location