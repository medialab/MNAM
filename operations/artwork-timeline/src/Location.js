
import * as THREE from 'three'

class Location {
  constructor (id, position, noChildren) {
    this.id = id
    this.position = position
    this.rad = 0
    this.count = 0
    this.nodeSize = 10
    this.children = []

    if (!noChildren) {
      const childrenCount = Math.floor(Math.random() * 5)
      let theta = 0
      const rad = 50
      this.children = new Array(childrenCount)
        .fill(null)
        .map((c, i) => {
          const pos = this.position.clone().add(new THREE.Vector3(Math.cos(theta) * rad * 2, Math.sin(theta) * rad * 2, 0))
          theta += Math.PI * 2 / childrenCount
          return new Location(this.id + i, pos, true)
        })
    }
  }

  update () {
    this.rad = Math.sqrt(this.nodeSize / 2 * this.count)
    let theta = 0
    this.children.forEach(c => {
      c.position = this.position.clone().add(new THREE.Vector3(Math.cos(theta) * this.rad * 2, Math.sin(theta) * this.rad * 2, 0))
      theta += Math.PI * 2 / this.children.length
    })
  }
}

export default Location