

import React, { Component } from 'react'
import * as THREE from 'three'
import React3 from 'react-three-renderer'
import { indexOfMax, toScreenPosition } from './utils'
import { hcl, rgb } from 'd3-color'

export default class DistributionGraph extends Component {
  constructor (props) {
    super(props)
    this.state = {
      vertices: [],
      faces: [],
      colors: [],
      rotation: new THREE.Vector2(Math.PI + 2 * Math.PI / 8, Math.PI + Math.PI / 3),
      rotationOffset: new THREE.Vector2(),
      dragOrigin: new THREE.Vector2(),
      dragOffset: new THREE.Vector2(),
      domains: new THREE.Vector3(),
      origin: new THREE.Vector3()
    }
  }

  componentDidMount () {
    const data = this.props.data
    const vertices = []
    const faces = []
    const colors = []

    const xFactor = 8
    const yFactor = 8
    const zFactor = Math.pow(300, 2)

    const origin = new THREE.Vector3(-data.length * xFactor / 2, -data[0].length * yFactor / 2, Math.sqrt(zFactor) / 3)

    const maxVolume = data.reduce((max, year) => {
      return Math.max(max, Math.max(...year)) 
    }, 0)

    const domains = new THREE.Vector3(data.length - 1, data[0].length - 1, maxVolume)

    for (let i = 0; i < data.length - 1; i++) {
      for (let j = 0; j < data[i].length - 1; j++) {
        vertices.push(
          new THREE.Vector3(data.length * xFactor - i * xFactor, j * yFactor, -Math.sqrt(data[i][j] * zFactor)).add(origin),
          new THREE.Vector3(data.length * xFactor - (i + 1) * xFactor, j * yFactor, -Math.sqrt(data[i + 1][j] * zFactor)).add(origin),
          new THREE.Vector3(data.length * xFactor - (i + 1) * xFactor, (j + 1) * yFactor, -Math.sqrt(data[i + 1][j + 1] * zFactor)).add(origin),
          new THREE.Vector3(data.length * xFactor - i * xFactor, (j + 1) * yFactor, -Math.sqrt(data[i][j + 1] * zFactor)).add(origin)
        )

        const len = vertices.length
        
        const f1 = new THREE.Face3(len - 4, len - 3, len - 2)
        const f2 = new THREE.Face3(len - 4, len - 2, len - 1)
        faces.push(f1, f2)

        const hclColor = hcl(Math.floor(Math.random() * 360), 70, 70)
        const rgbColor = hclColor.rgb()

        f1.vertexColors = [
          new THREE.Color(1 - Math.sqrt(Math.sqrt(data[i][j])), 1 - Math.sqrt(Math.sqrt(data[i][j])), 1),
          new THREE.Color(1 - Math.sqrt(Math.sqrt(data[i + 1][j])), 1 - Math.sqrt(Math.sqrt(data[i + 1][j])), 1),
          new THREE.Color(1 - Math.sqrt(Math.sqrt(data[i + 1][j + 1])), 1 - Math.sqrt(Math.sqrt(data[i + 1][j + 1])), 1)
        ]

        f2.vertexColors = [
          new THREE.Color(1 - Math.sqrt(Math.sqrt(data[i][j])), 1 - Math.sqrt(Math.sqrt(data[i][j])), 1),
          new THREE.Color(1 - Math.sqrt(Math.sqrt(data[i + 1][j + 1])), 1 - Math.sqrt(Math.sqrt(data[i + 1][j + 1])), 1),
          new THREE.Color(1 - Math.sqrt(Math.sqrt(data[i][j + 1])), 1 - Math.sqrt(Math.sqrt(data[i][j + 1])), 1)
        ]
      }
    }

    this.setState(
      {
        ...this.state,
        vertices,
        faces,
        colors,
        domains,
        origin
      }
    )
  }

  render () {
    const {
      vertices,
      faces,
      colors,
      rotation,
      rotationOffset,
      dragOffset,
      dragOrigin,
      domains,
      origin
    } = this.state

    const width = window.innerWidth - 100
    const height = (window.innerWidth - 100) * (3 / 4)

    const axesVertices = [
      new THREE.Vector3(8, domains.y * 8, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, domains.y * 8, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, domains.y * 8, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, -Math.sqrt(1 * 100000)).add(origin)
    ]

    const xAxisLabels = []
    const yAxisLabels = []
    const zAxisLabels = []

    if (this.refs.rotation) {
      this.refs.rotation.updateMatrixWorld()

      xAxisLabels.push(
        ...new Array((domains.x + 1) / 10 + 1)
          .fill(0)
          .map((v, i) => {
            const content = 1945 + i * 10
            const pos = toScreenPosition(
              axesVertices[0].clone()
                .lerp(axesVertices[1], 1 - i / ((domains.x + 1) / 10))
                .applyMatrix4(this.refs.rotation.matrix),
              this.refs.camera
            )
            return {
              content,
              pos
            }
          })
          .map((label, i) => {
            label.pos.x *= width
            label.pos.y *= height
            return (
              <div
                key={ `label-time-${i}` }
                style={{
                  position: 'absolute',
                  left: label.pos.x,
                  top: label.pos.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <p
                  style={{
                    marginTop: 20
                  }}
                >
                  { i > 0 ? label.content : '' }
                </p>
              </div>
            )
          })
      )

      yAxisLabels.push(
        ...new Array(Math.floor(domains.y / 5) + 1)
          .fill(0)
          .map((v, i) => {
            const content = i * 5 + 1
            const pos = toScreenPosition(
              axesVertices[2].clone()
                .lerp(axesVertices[3], i / (Math.floor((domains.y + 1) / 5)))
                .applyMatrix4(this.refs.rotation.matrix),
              this.refs.camera
            )
            return {
              content,
              pos
            }
          })
          .map((label, i) => {
            label.pos.x *= width
            label.pos.y *= height
            return (
              <div
                key={ `label-seniority-${i}` }
                style={{
                  position: 'absolute',
                  left: label.pos.x,
                  top: label.pos.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <p
                  style={{
                    marginLeft: -20
                  }}
                >
                  { label.content }
                </p>
              </div>
            )
          })
      )

      zAxisLabels.push(
        ...new Array(11)
          .fill(0)
          .map((v, i) => {
            const content = (Math.floor(Math.pow(i / 10, 2) * 100)) + '%'
            const pos = toScreenPosition(
              axesVertices[4].clone()
                .lerp(axesVertices[5], i / 10)
                .applyMatrix4(this.refs.rotation.matrix),
              this.refs.camera
            )
            return {
              content,
              pos
            }
          })
          .map((label, i) => {
            label.pos.x *= width
            label.pos.y *= height
            return (
              <div
                key={ `label-seniority-${i}` }
                style={{
                  position: 'absolute',
                  left: label.pos.x,
                  top: label.pos.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <p
                  style={{
                    margin: 0,
                    paddingRight: 70,
                    marginTop: -4,
                    textAlign: 'right'
                  }}
                >
                  { i > 0 ? label.content : '' }
                </p>
              </div>
            )
          })
      )
    }

    return (
      <div
        onMouseDown={(event) => {
          var bounds = event.target.getBoundingClientRect()
          var x = event.clientX - bounds.left
          var y = event.clientY - bounds.top
          this.setState({
            ...this.state,
            rotationOffset: new THREE.Vector2(),
            dragOrigin: new THREE.Vector2(x, -y)
          })
        }}
        onMouseMove={(event) => {
          const {
            dragOrigin
          } = this.state

          if (dragOrigin.length() === 0) {
            return null
          }

          var bounds = event.target.getBoundingClientRect()
          var x = event.clientX - bounds.left
          var y = event.clientY - bounds.top
          this.setState({
            ...this.state,
            rotationOffset: new THREE.Vector2(x, -y).sub(dragOrigin).multiplyScalar(0.01)
          })
        }}
        onMouseUp={(event) => {
          this.setState({
            ...this.state,
            rotation: this.state.rotation.clone().sub(this.state.rotationOffset),
            rotationOffset: new THREE.Vector2(),
            dragOrigin: new THREE.Vector2()
          })
        }}
      >
        <ul
          className="buttons"
        >
          <li
            onClick={() => {
              this.setState({
                ...this.state,
                rotation: new THREE.Vector2(Math.PI + 2 * Math.PI / 8, Math.PI + Math.PI / 3)
              }, () => this.forceUpdate())
            }}
          >
            3D
          </li>
          <li
            onClick={() => {
              this.setState({
                ...this.state,
                rotation: new THREE.Vector2(Math.PI, Math.PI + Math.PI / 2)
              }, () => this.forceUpdate())
            }}
          >
            New
          </li>
          <li
            onClick={() => {
              this.setState({
                ...this.state,
                rotation: new THREE.Vector2(Math.PI, Math.PI)
              }, () => this.forceUpdate())
            }}
          >
            Old
          </li>
        </ul>
        <div
          className="dom-labels"
          style={{
            width,
            height
          }}
        >
          { xAxisLabels }
          { yAxisLabels }
          { zAxisLabels }
        </div>
        <React3
          mainCamera="camera"
          width={ width }
          height={ height }
          alpha
          antialias
        >
          <scene
            ref={ 'scene' }
          >
            <orthographicCamera
              name="camera"
              left={ -width / 2 }
              right={ width / 2 }
              top={ -height / 2 }
              near={ 0.001 }
              far={ 10000 }
              bottom={ height / 2 }
              position={ new THREE.Vector3(0, 0, 1000) }
              lookAt={ new THREE.Vector3(0, 0, 0) }
              ref="camera"
            />
            <object3D
              rotation={ new THREE.Euler(
                rotation.y - rotationOffset.y, 
                0, 
                rotation.x - rotationOffset.x, 'XYZ'
              ) }
              ref="rotation" 
            >
              <mesh>
                <geometry
                  vertices={ vertices }
                  faces={ faces }
                />
                <meshBasicMaterial
                  vertexColors={ THREE.VertexColors }
                  side={ THREE.BackSide }
                />
              </mesh>
              <lineSegments
                ref="axes"
              >
                <geometry
                  vertices={ axesVertices }
                />
                <lineBasicMaterial
                  color={ 0xaaaaaa }
                  depthTest={ false }
                />
              </lineSegments>
            </object3D>

          </scene>
        </React3>
      </div>
    )
  }
}