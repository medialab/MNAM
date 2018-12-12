

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
      // rotation: new THREE.Vector2(Math.PI + 2 * Math.PI / 8, Math.PI + Math.PI / 3),
      rotation: new THREE.Vector2(-Math.PI / 8, Math.PI / 3, 0),
      rotationOffset: new THREE.Vector2(),
      dragOrigin: new THREE.Vector2(),
      dragOffset: new THREE.Vector2(),
      domains: new THREE.Vector3(),
      origin: new THREE.Vector3(),
      raycast: new THREE.Vector3(),
      trajectories: [],
      trajectoriesGeometry: null
    }

    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
  }

  componentDidMount () {
    const data = this.props.data
    const vertices = []
    const faces = []
    const colors = []

    const xFactor = 8
    const yFactor = 50
    const zFactor = 12

    const origin = new THREE.Vector3(-data.length * xFactor / 2, data[0].length * yFactor / 2, zFactor * 25 / 2)
    const domains = new THREE.Vector3(data.length - 1, data[0].length - 1, 30)

    for (let i = 0; i < data.length - 1; i++) {
      for (let j = 0; j < data[i].length - 1; j++) {
        vertices.push(
          new THREE.Vector3((data.length - i) * xFactor, -j * yFactor, -data[i][j] * zFactor).add(origin),
          new THREE.Vector3((data.length - (i + 1)) * xFactor, -j * yFactor, -data[i + 1][j] * zFactor).add(origin),
          new THREE.Vector3((data.length - (i + 1)) * xFactor, -(j + 1) * yFactor, -data[i + 1][j + 1] * zFactor).add(origin),
          new THREE.Vector3((data.length - i) * xFactor, -(j + 1) * yFactor, -data[i][j + 1] * zFactor).add(origin)
        )

        const len = vertices.length
        
        const f1 = new THREE.Face3(len - 4, len - 3, len - 2)
        const f2 = new THREE.Face3(len - 4, len - 2, len - 1)
        faces.push(f1, f2)

        const hclColor = hcl(Math.floor(Math.random() * 360), 70, 70)
        const rgbColor = hclColor.rgb()

        f1.vertexColors = [
          new THREE.Color(1 - Math.min(1, data[i][j] / 12), 1 - Math.min(1, data[i][j] / 12), 1),
          new THREE.Color(1 - Math.min(1, data[i + 1][j] / 12), 1 - Math.min(1, data[i + 1][j] / 12), 1),
          new THREE.Color(1 - Math.min(1, data[i + 1][j + 1] / 12), 1 - Math.min(1, data[i + 1][j + 1] / 12), 1)
        ]

        f2.vertexColors = [
          new THREE.Color(1 - Math.min(1, data[i][j] / 12), 1 - Math.min(1, data[i][j] / 12), 1),
          new THREE.Color(1 - Math.min(1, data[i + 1][j + 1] / 12), 1 - Math.min(1, data[i + 1][j + 1] / 12), 1),
          new THREE.Color(1 - Math.min(1, data[i][j + 1] / 12), 1 - Math.min(1, data[i][j + 1] / 12), 1)
        ]
      }
    }

    const maxArtistCount = 10000
    const position = new THREE.Float32BufferAttribute(new Array(maxArtistCount * 3).fill(0), 3)
    const color = new THREE.Float32BufferAttribute(new Array(maxArtistCount * 3).fill(0), 3)

    const trajectoriesGeometry = {
      position,
      color
    }


    this.setState(
      {
        ...this.state,
        vertices,
        faces,
        colors,
        domains,
        origin,
        trajectoriesGeometry
      }
    )
  }

  onMouseDown (event) {
    var bounds = event.target.getBoundingClientRect()
    var x = event.clientX - bounds.left
    var y = event.clientY - bounds.top
    this.setState({
      ...this.state,
      rotationOffset: new THREE.Vector2(),
      dragOrigin: new THREE.Vector2(-x, -y)
    })
  }

  onMouseMove (event) {
    const {
      dragOrigin,
      vertices,
      rotation,
    } = this.state

    var bounds = event.target.getBoundingClientRect()
    const width = window.innerWidth - 100
    const height = (window.innerWidth - 100) * (3 / 4)
    var x = event.clientX - bounds.left
    var y = event.clientY - bounds.top

    var raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector3(
      x / width * 2 - 1,
      -y / height * 2 + 1,
      0
    )

    this.refs.camera.updateMatrix()
    this.refs.camera.updateMatrixWorld()
    this.refs.mesh.updateMatrix()
    this.refs.mesh.updateMatrixWorld()

    raycaster.setFromCamera(mouse, this.refs.camera)
    const r = raycaster.intersectObject(this.refs.mesh)
    let raycast

    

    if (r && r.length > 0) {
      const invertRotation = new THREE.Euler(
        -(rotation.y + this.state.rotationOffset.y), 
        0, 
        -(rotation.x + this.state.rotationOffset.x), 
        'ZYX'
      )
      const point = r[0].point.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(invertRotation))
      const face = r[0].face
      const closestVertex = [vertices[face.a], vertices[face.b], vertices[face.c]]
        .sort((a, b) => a.distanceTo(point) - b.distanceTo(point))[0]
      if (closestVertex.z < 100) {
        raycast = closestVertex.clone()
      }
    }


    let rotationOffset = this.state.rotationOffset
    if (dragOrigin.length() !== 0) {
      rotationOffset = new THREE.Vector2(-x, -y).sub(dragOrigin).multiplyScalar(0.01)
    }

    this.setState({
      ...this.state,
      raycast: raycast || new THREE.Vector3(-2000, -2000, 0),
      rotationOffset
    })
  }

  onMouseUp (event) {
    const {
      rotationOffset,
      rotation
    } = this.state

    this.setState({
      ...this.state,
      rotation: rotation.clone().add(rotationOffset),
      rotationOffset: new THREE.Vector2(),
      dragOrigin: new THREE.Vector2()
    })
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
      origin,
      trajectoriesGeometry
    } = this.state

    // if (trajectoriesGeometry) console.log(trajectoriesGeometry.color.array)

    const width = window.innerWidth - 100
    const height = (window.innerWidth - 100) * (3 / 4)

    const axesVertices = [
      new THREE.Vector3(8, -domains.y * 50, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, -domains.y * 50, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, -domains.y * 50, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, -12 * 30).add(origin)
    ]

    const xAxisLabels = []
    const yAxisLabels = []
    const zAxisLabels = []

    if (this.refs.rotation) {
      this.refs.rotation.updateMatrixWorld()

      xAxisLabels.push(
        ...new Array(domains.x / 10 + 1)
          .fill(0)
          .map((v, i) => {
            const content = 1945 + i * 10
            const pos = toScreenPosition(
              axesVertices[0].clone()
                .lerp(axesVertices[1], 1 - i / (domains.x / 10))
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
        ...new Array(Math.floor(domains.y) + 1)
          .fill(0)
          .map((v, i) => {
            const content = i + 1
            const pos = toScreenPosition(
              axesVertices[2].clone()
                .lerp(axesVertices[3], i / 10)
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
            const content = i * 3
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
        onMouseDown={ this.onMouseDown }
        onMouseMove={ this.onMouseMove }
        onMouseUp={ this.onMouseUp }
      >
        <ul
          className="buttons"
        >
          <li
            onClick={(event) => {
              event.preventDefault()
              this.setState({
                ...this.state,
                rotation: new THREE.Vector2(-Math.PI / 8, Math.PI / 3, 0)
              }, () => this.forceUpdate())
            }}
          >
            3D
          </li>
          <li
            onClick={(event) => {
              event.preventDefault()
              this.setState({
                ...this.state,
                rotation: new THREE.Vector2(0, Math.PI / 2)
              }, () => this.forceUpdate())
            }}
          >
            New
          </li>
          <li
            onClick={(event) => {
              event.preventDefault()
              this.setState({
                ...this.state,
                rotation: new THREE.Vector2(0, 0)
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
              top={ height / 2 }
              bottom={ -height / 2 }
              near={ 0.001 }
              far={ 10000 }
              position={ new THREE.Vector3(0, 0, -1000) }
              lookAt={ new THREE.Vector3(0, 0, 0) }
              ref="camera"
            />
            <object3D
              rotation={ new THREE.Euler(rotation.y + rotationOffset.y, 0, rotation.x + rotationOffset.x, 'XYZ') }
              ref="rotation" 
            >
            {/*
              <mesh
                position={ this.state.raycast }
              >
                <sphereGeometry
                  radius={ 2 }
                />
                <meshBasicMaterial
                  color={ 0xff0000 }
                />
              </mesh>
            */}
              <mesh
                ref={ 'mesh' }
              >
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
              <lineSegments>
                <bufferGeometry
                  { ...trajectoriesGeometry }
                />
                <lineBasicMaterial
                  depthTest={ false }
                  vertexColors={ THREE.VertexColors }
                />
              </lineSegments>
            </object3D>

          </scene>
        </React3>
      </div>
    )
  }
}