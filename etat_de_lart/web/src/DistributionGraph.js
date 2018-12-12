
import React, { Component } from 'react'
import * as THREE from 'three'
import React3 from 'react-three-renderer'
import { toScreenPosition } from './utils'
import { hcl } from 'd3-color'
import { nodeVertexShader, nodeFragmentShader } from './shaders.js'

export default class DistributionGraph extends Component {
  constructor (props) {
    super(props)
    this.state = {
      vertices: [],
      faces: [],
      rotation: new THREE.Vector2(-Math.PI / 8, Math.PI / 3, 0),
      rotationOffset: new THREE.Vector2(),
      dragOrigin: new THREE.Vector2(),
      dragOffset: new THREE.Vector2(),
      domains: new THREE.Vector3(),
      origin: new THREE.Vector3(),
      raycast: new THREE.Vector3(),
      trajectories: [],
      trajectoriesGeometry: null,
      selectedArtists: null,
      artistInput: ''
    }

    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.selectSingleArtist = this.selectSingleArtist.bind(this)
    this.initializeGeometry = this.initializeGeometry.bind(this)
  }

  componentDidMount () {
    const geometries = this.props.data.map(this.initializeGeometry)

    const maxArtistCount = 10000

    const trajectoriesGeometry = {
      position: new THREE.Float32BufferAttribute(new Array(maxArtistCount * 3).fill(0), 3),
      color: new THREE.Float32BufferAttribute(new Array(maxArtistCount * 3).fill(0), 3)
    }

    const acquisitionGeometry = {
      position: new THREE.Float32BufferAttribute(new Array(maxArtistCount * 3).fill(-10000), 3),
      color: new THREE.Float32BufferAttribute(new Array(maxArtistCount * 3).fill(0), 3)
    }

    this.setState(
      {
        ...this.state,
        geometries,
        trajectoriesGeometry,
        acquisitionGeometry
      }
    )
  }

  initializeGeometry (data) {
    const vertices = []
    const faces = []

    const xFactor = 8
    const yFactor = 8
    const zFactor = Math.pow(300, 2)

    const origin = new THREE.Vector3(-data.length * xFactor / 2, data[0].length * yFactor / 2, Math.sqrt(zFactor) / 3)

    const maxVolume = data.reduce((max, year) => {
      return Math.max(max, Math.max(...year))
    }, 0)

    const domains = new THREE.Vector3(data.length - 1, data[0].length - 1, maxVolume)

    for (let i = 0; i < data.length - 1; i++) {
      for (let j = 0; j < data[i].length - 1; j++) {
        vertices.push(
          new THREE.Vector3((data.length - i) * xFactor, -j * yFactor, -Math.sqrt(data[i][j] * zFactor)).add(origin),
          new THREE.Vector3((data.length - (i + 1)) * xFactor, -j * yFactor, -Math.sqrt(data[i + 1][j] * zFactor)).add(origin),
          new THREE.Vector3((data.length - (i + 1)) * xFactor, -(j + 1) * yFactor, -Math.sqrt(data[i + 1][j + 1] * zFactor)).add(origin),
          new THREE.Vector3((data.length - i) * xFactor, -(j + 1) * yFactor, -Math.sqrt(data[i][j + 1] * zFactor)).add(origin)
        )

        const len = vertices.length

        const f1 = new THREE.Face3(len - 4, len - 3, len - 2)
        const f2 = new THREE.Face3(len - 4, len - 2, len - 1)
        faces.push(f1, f2)

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

    return {
      vertices,
      faces,
      origin,
      domains
    }
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
      rotation
    } = this.state

    const vertices = this.state.geometries[0].vertices

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

    if (rotationOffset.length() > 0) {
      this.setState({
        ...this.state,
        rotation: rotation.clone().add(rotationOffset),
        rotationOffset: new THREE.Vector2(),
        dragOrigin: new THREE.Vector2()
      })
    } else if (this.props.artists) {
      const {
        raycast,
        trajectoriesGeometry,
        acquisitionGeometry
      } = this.state

      const {
        data,
        artists
      } = this.props

      if (raycast.length() < 2000) {
        const year = -raycast.x / 8 + data.length / 2 + 1945
        const count = -raycast.y / 8 + data[0].length / 2

        const selectedArtists = Object.keys(artists).map(id => artists[id])
          .filter(artist => artist.acquisitionDates.indexOf(year) === count)

        const xFactor = 8
        const yFactor = 8
        const zFactor = Math.pow(300, 2)
        const origin = new THREE.Vector3(-data.length * xFactor / 2, data[0].length * yFactor / 2, Math.sqrt(zFactor) / 3)

        let colorIndex = 0
        const trajectories = selectedArtists
          .map(artist => {
            const coordinates = artist.acquisitionDates
              .map((year, i) => [year, i])
              .filter(acquisition => acquisition[0] >= 1945)
              .map(acquisition => {
                const i = acquisition[0] - 1945
                const j = acquisition[1]
                const coords = new THREE.Vector3(
                  (data.length - i) * xFactor,
                  -j * yFactor,
                  -Math.sqrt(data[i][j] * zFactor)
                ).add(origin)

                return coords
              })
              .reduce((array, coords) => {
                array.push(...[coords.x, coords.y, coords.z, coords.x, coords.y, coords.z])
                return array
              }, [])
              .slice(3, -3)

            for (let i = 0; i < coordinates.length / 3; i++) {
              trajectoriesGeometry.color.array[colorIndex + 0] = artist.color[0]
              trajectoriesGeometry.color.array[colorIndex + 1] = artist.color[1]
              trajectoriesGeometry.color.array[colorIndex + 2] = artist.color[2]

              // TODO points appear twice
              acquisitionGeometry.color.array[colorIndex + 0] = artist.color[0]
              acquisitionGeometry.color.array[colorIndex + 1] = artist.color[1]
              acquisitionGeometry.color.array[colorIndex + 2] = artist.color[2]

              colorIndex += 3
            }

            return coordinates
          })
          .reduce((array, coords) => {
            array.push(...coords)
            return array
          }, [])

        const trajectoriesLength = trajectories.length
        const trajectoriesGeometryLength = 10000 * 3

        for (let i = 0; i < trajectoriesLength; i++) {
          trajectoriesGeometry.position.array[i] = trajectories[i]
          acquisitionGeometry.position.array[i] = trajectories[i]
        }

        for (let i = trajectoriesLength; i < trajectoriesGeometryLength; i++) {
          trajectoriesGeometry.position.array[i] = 0
          acquisitionGeometry.position.array[i] = -10000
        }

        trajectoriesGeometry.position.needsUpdate = true
        trajectoriesGeometry.color.needsUpdate = true

        acquisitionGeometry.position.needsUpdate = true
        acquisitionGeometry.color.needsUpdate = true

        this.setState({
          ...this.state,
          rotationOffset: new THREE.Vector2(),
          dragOrigin: new THREE.Vector2(),
          selectedArtists
        })
      } else {
        const trajectoriesGeometryLength = 10000 * 3

        for (let i = 0; i < trajectoriesGeometryLength; i++) {
          trajectoriesGeometry.position.array[i] = 0
          acquisitionGeometry.position.array[i] = -10000
        }

        trajectoriesGeometry.position.needsUpdate = true
        acquisitionGeometry.position.needsUpdate = true

        this.setState({
          ...this.state,
          rotationOffset: new THREE.Vector2(),
          dragOrigin: new THREE.Vector2(),
          selectedArtists: null
        })
      }
    } else {
      this.setState({
        ...this.state,
        rotationOffset: new THREE.Vector2(),
        dragOrigin: new THREE.Vector2(),
        selectedArtists: null
      })
    }
  }

  selectSingleArtist (name) {
    const {
      trajectoriesGeometry,
      acquisitionGeometry
    } = this.state

    const {
      data,
      artists
    } = this.props

    const selectedArtists = [artists[Object.keys(artists).find(id => name === id)]]

    const xFactor = 8
    const yFactor = 8
    const zFactor = Math.pow(300, 2)
    const origin = new THREE.Vector3(-data.length * xFactor / 2, data[0].length * yFactor / 2, Math.sqrt(zFactor) / 3)
    let colorIndex = 0

    if (!selectedArtists[0]) {
      return this.setState({
        ...this.state,
        artistInput: ''
      })
    }

    const trajectories = selectedArtists
      .map(artist => {
        const coordinates = artist.acquisitionDates
          .map((year, i) => [year, i])
          .filter(acquisition => acquisition[0] >= 1945)
          .map(acquisition => {
            const i = acquisition[0] - 1945
            const j = acquisition[1]
            const coords = new THREE.Vector3(
              (data.length - i) * xFactor,
              -j * yFactor,
              -Math.sqrt(data[i][j] * zFactor)
            ).add(origin)
            return coords
          })
          .reduce((array, coords) => {
            array.push(...[coords.x, coords.y, coords.z, coords.x, coords.y, coords.z])
            return array
          }, [])
          .slice(3, -3)

        for (let i = 0; i < coordinates.length / 3; i++) {
          trajectoriesGeometry.color.array[colorIndex + 0] = artist.color[0]
          trajectoriesGeometry.color.array[colorIndex + 1] = artist.color[1]
          trajectoriesGeometry.color.array[colorIndex + 2] = artist.color[2]

          // TODO points appear twice
          acquisitionGeometry.color.array[colorIndex + 0] = artist.color[0]
          acquisitionGeometry.color.array[colorIndex + 1] = artist.color[1]
          acquisitionGeometry.color.array[colorIndex + 2] = artist.color[2]

          colorIndex += 3
        }

        return coordinates
      })
      .reduce((array, coords) => {
        array.push(...coords)
        return array
      }, [])

    const trajectoriesLength = trajectories.length
    const trajectoriesGeometryLength = 10000 * 3
    for (let i = 0; i < trajectoriesLength; i++) {
      trajectoriesGeometry.position.array[i] = trajectories[i]
      acquisitionGeometry.position.array[i] = trajectories[i]
    }
    for (let i = trajectoriesLength; i < trajectoriesGeometryLength; i++) {
      trajectoriesGeometry.position.array[i] = 0
      acquisitionGeometry.position.array[i] = -10000
    }

    trajectoriesGeometry.position.needsUpdate = true
    trajectoriesGeometry.color.needsUpdate = true

    acquisitionGeometry.position.needsUpdate = true
    acquisitionGeometry.color.needsUpdate = true

    this.setState({
      ...this.state,
      selectedArtists,
      artistInput: ''
    })
  }

  render () {
    const {
      geometries,
      rotation,
      rotationOffset,
      trajectoriesGeometry,
      acquisitionGeometry,
      selectedArtists,
      artistInput
    } = this.state

    const {
      artists
    } = this.props

    if (!geometries) {
      return null
    }

    const geometryIndex = this.props.geometryIndex || 0

    const {
      vertices,
      faces,
      origin,
      domains
    } = geometries[geometryIndex]

    const width = window.innerWidth - 100
    const height = window.innerHeight - 100

    const axesVertices = [
      new THREE.Vector3(8, -domains.y * 8, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, -domains.y * 8, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, -domains.y * 8, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, 0).add(origin),
      new THREE.Vector3(1 + (domains.x + 1) * 8, 0, -Math.sqrt(1 * 100000)).add(origin)
    ]

    const xAxisLabels = []
    const yAxisLabels = []
    const zAxisLabels = []

    const rotationMatrix = new THREE.Matrix4()
      .makeRotationFromEuler(new THREE.Euler(rotation.y + rotationOffset.y, 0, rotation.x + rotationOffset.x, 'XYZ'))

    const camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0.001, 10000)
    camera.position.set(0, 0, -1000)

    xAxisLabels.push(
      ...new Array(Math.floor(domains.x / 10) + 1)
        .fill(0)
        .map((v, i) => {
          const content = 1945 + i * 10
          const pos = toScreenPosition(
            axesVertices[0].clone()
              .lerp(axesVertices[1], 1 - i / (domains.x / 10))
              .applyMatrix4(rotationMatrix),
            camera
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
              key={`label-time-${i}`}
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
          const content = i * 5
          const pos = toScreenPosition(
            axesVertices[2].clone()
              .lerp(axesVertices[3], i / (Math.floor((domains.y + 1) / 5)))
              .applyMatrix4(rotationMatrix),
            camera
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
              key={`label-seniority-${i}`}
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
              .applyMatrix4(rotationMatrix),
            camera
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
              key={`label-seniority-${i}`}
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

    let artistsLegend = null
    if (selectedArtists) {
      artistsLegend = Object.keys(selectedArtists)
        .map(name => selectedArtists[name])
        .sort((a1, a2) => a2.acquisitionDates.length - a1.acquisitionDates.length)
        .slice(0, 25)
        .map((artist, i) => {
          return (
            <li
              key={`artist-${i}`}
              style={{
                color: `rgb(${artist.color[0] * 255}, ${artist.color[1] * 255}, ${artist.color[2] * 255})`
              }}
            >
              { artist.name }
            </li>
          )
        })
    }

    let artistCompletion = null
    if (artists && artistInput.length > 2) {
      artistCompletion = Object.keys(artists)
        .filter(id => id.toLowerCase().indexOf(artistInput.toLowerCase()) > -1)
        .slice(0, 20)
        .map((id, i) => {
          const artist = artists[id]
          return (
            <li
              key={`artist-option-${i}`}
              style={{
                margin: 0
              }}
              onClick={() => {
                this.selectSingleArtist(artist.name)
              }}
            >
              { artist.name }
            </li>
          )
        })
    }

    console.log(width, height)

    return (
      <div
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
      >
        <div className='overlay'>
          <ul
            className='buttons'
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
            <li
              style={{
                padding: 0,
                position: 'relative'
              }}
            >
              <input
                type='text'
                value={artistInput}
                onChange={(event) => {
                  this.setState({
                    ...this.state,
                    artistInput: event.target.value
                  })
                }}
                onBlur={(event) => {
                  // this.setState({
                  //   ...this.state,
                  //   artistInput: ''
                  // })
                }}
              />
              <ul
                style={{
                  display: 'block',
                  position: 'absolute',
                  margin: 0
                }}
              >
                { artistCompletion }
              </ul>
            </li>
          </ul>
          <ul
            className='dom-legend'
            style={{
              textAlign: 'right',
              pointerEvents: 'none',
              fontSize: 11
            }}
          >
            { artistsLegend }
          </ul>
        </div>
        <div
          className='dom-labels'
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
          mainCamera='camera'
          width={width}
          height={height}
          alpha
          antialias
        >
          <scene
            ref={'scene'}
          >
            <orthographicCamera
              name='camera'
              left={-width / 2}
              right={width / 2}
              top={height / 2}
              bottom={-height / 2}
              near={0.001}
              far={10000}
              position={new THREE.Vector3(0, 0, -1000)}
              lookAt={new THREE.Vector3(0, 0, 0)}
              ref='camera'
            />
            <object3D
              rotation={new THREE.Euler(rotation.y + rotationOffset.y, 0, rotation.x + rotationOffset.x, 'XYZ')}
            >
              <mesh
                ref={'mesh'}
              >
                <geometry
                  vertices={vertices}
                  faces={faces}
                />
                <meshBasicMaterial
                  vertexColors={THREE.VertexColors}
                  side={THREE.BackSide}
                />
              </mesh>
              <lineSegments
                ref='axes'
              >
                <geometry
                  vertices={axesVertices}
                />
                <lineBasicMaterial
                  color={0xaaaaaa}
                  depthTest={false}
                />
              </lineSegments>
              <lineSegments>
                <bufferGeometry
                  {...trajectoriesGeometry}
                />
                <lineBasicMaterial
                  depthTest={false}
                  vertexColors={THREE.VertexColors}
                />
              </lineSegments>
              <points
                frustumCulled={false}
              >
                <bufferGeometry
                  {...acquisitionGeometry}
                />
                <shaderMaterial
                  vertexShader={nodeVertexShader}
                  fragmentShader={nodeFragmentShader}
                  vertexColors={THREE.VertexColors}
                  depthTest={false}
                  transparent
                />
              </points>
            </object3D>

          </scene>
        </React3>
      </div>
    )
  }
}
