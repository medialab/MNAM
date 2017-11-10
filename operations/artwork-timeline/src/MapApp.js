
/*

  location label
  children position doesn't update?
  color coding
  sort colors in locations

  swing by parent location when going somewhere else
  playback
  remove unknown from locations
  location theta per locationMap distribution

*/


import React, { Component } from 'react'
import Artwork from './Artwork'
import { map, shuffleArray, lerp } from './utils'
import { cubehelix } from 'd3-color'
import * as THREE from 'three'

import Node from './Node'
import Location from './Location'

import './App.css';

const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = size * ( 300.0 / -mvPosition.z );
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform sampler2D texture;
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4( vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
  }
`



class MapApp extends Component {
  constructor (props) {
    super(props)
    this.state = {
      artworks: [],
      timeRange: [10000000000000, 0],
      artworkCount: 10000,
      stopList: [
        150000000030351,
        150000000029858,
        150000000017493,
        150000000026300,
        150000000039547,
        150000000022506,
        150000000005353,
        150000000014640,
        150000000066484,
        150000000455601,
        150000000043959,
        150000000045372,
        150000000019231,
        150000000030904,
        150000000023706,
        150000000017432,
        150000000012643
      ],
      nodes: [],
      nodeGrid: [],
      locations: [],
      currentDate: new Date(0),
      speed: 1000 * 60 * 60 * 24,
      width: 100,
      height: 100,
      operationTotal: 0
    }

    this.init = this.init.bind(this)
    this.tick = this.tick.bind(this)
  }

  componentDidMount () {
    if (Object.keys(this.props).length > 0) this.init(this.props)
    console.log('mounted map')
  }

  init (props) {
    const {
      timeRange,
      artworkCount,
      stopList,
    } = this.state

    const width = document.getElementById('root').clientWidth
    const height = document.getElementById('root').clientHeight

    const artworks = props.data
      .filter((d, i) => i < artworkCount)
      .filter((d, i) => {
        return d.opt_field.filter(o => {
          return !!o.opt_branch && o.opt_branch !== 'unknown'
        }).length > 5
      })
      .map(a => {
        const operations = a.opt_field
          .filter(o => {
            return new Date(o.date).getTime() >= new Date('1/1/1995').getTime()
          })
          .sort((a, b) => {
            return new Date(a.date) - new Date(b.date).getTime()
          })
          .map(o => {
            return {
              ...o,
              date: new Date(o.date).getTime()
            }
          })
          return {
            ...a,
            operations
          }
      })

    console.log(artworks.length, 'artworks loaded')

    timeRange[0] = artworks.reduce((a, b) => {
      const minOperations = b.operations.reduce((c, d) => {
        return Math.min(c, new Date(d.date).getTime())
      }, a)
      return Math.min(a, minOperations)
    }, timeRange[0])

    timeRange[1] = Date.now()


    var scene = new THREE.Scene()
    var camera = new THREE.PerspectiveCamera( 60, width / height, 0.1, 1000 )
    // camera.position.set(0, 0, (height/2.0) / Math.tan(Math.PI*60.0 / 180.0))
    camera.position.set(0, 0, (height/2.0) / Math.tan(Math.PI*30.0/180.0))
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    var renderer = new THREE.WebGLRenderer()
    renderer.setSize(width, height)
    this.refs.wrapper.appendChild(renderer.domElement)

    var particleSystem, uniforms, geometry
    var particles = 100000

    uniforms = {
      texture:   { value: new THREE.TextureLoader().load( process.env.PUBLIC_URL + '/node.png' ) }
    }

    var shaderMaterial = new THREE.ShaderMaterial( {
      uniforms:       uniforms,
      vertexShader:   vertexShader,
      fragmentShader: fragmentShader,
      blending:       THREE.AdditiveBlending,
      depthTest:      false,
      transparent:    true,
      vertexColors:   true
    })

    var radius = 200
    geometry = new THREE.BufferGeometry()

    var positions = []
    var colors = []
    var sizes = []

    var color = new THREE.Color()

    const nodes = artworks.map((a, i) => {
      const node = new Node(a, scene, width, height, i)
      positions.push(node.position.x, node.position.y, node.position.z)
      colors.push(node.color.r, node.color.g, node.color.b)
      sizes.push(node.size)
      return node
    })

    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) )
    geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) )
    geometry.addAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setDynamic( true ) )

    particleSystem = new THREE.Points(geometry, shaderMaterial)

    scene.add(particleSystem)

    let operationTotal = 0
    const locationMap = {}
    nodes.forEach(n => {
      n.operations.forEach(o => {
        if (!locationMap[o.opt_branch]) locationMap[o.opt_branch] = 0 
        locationMap[o.opt_branch] ++
        if (!!o.opt_branch) {
          operationTotal ++
        }
      })
    })
    console.log('locationMap', locationMap)

    // let theta = 0
    const locations = Object.keys(locationMap)
      .filter(l => l !== 'unknown' && l.indexOf('_') === -1)
      .map(l => {
        const location = new Location(l, locationMap[l])
        return location
      })

    Object.keys(locationMap)
      .filter(l => l.indexOf('_') > -1)
      .forEach(l => {
        const parentId = l.split('_')[0]
        if (!locations.find(p => p.id === parentId)) {
          const parent = new Location(parentId, 0)
          locations.push(parent)
        }
      })

    Object.keys(locationMap)
      .filter(l => l.indexOf('_') > -1)
      .forEach(l => {
        const parent = locations.find(p => p.id === l.split('_')[0])
        console.log(l, l.split('_')[0], locations.find(p => p.id === l.split('_')[0]))
        const location = new Location(l, locationMap[l])
        // console.log('mop', l, locationMap[l])
        parent.addChildren(location)
        return location
      })


    let rad = window.innerHeight / 3
    let theta = -Math.PI / 2
    locations
      .sort((a, b) => b.total - a.total)
      .forEach(l => {
        l.setLayout(new THREE.Vector3(), theta, rad)
        const locOperationCount = l.total + l.children.reduce((a, b) => a + b.total, 0)
        // console.log('aga', l.children.reduce((a, b) => a + b.total, 0))
        // theta += map(Math.sqrt(locOperationCount), 0, Math.sqrt(operationTotal), 0, Math.PI * 2)
        theta += Math.PI * 2 / locations.length
      })

    // console.log('test', locations
    //   .sort((a, b) => b.total - a.total))


    const currentDate = timeRange[0] - 100

    this.setState({
      ...this.state,
      timeRange,
      width,
      height,
      scene,
      camera,
      renderer,
      nodes,
      locations,
      currentDate,
      particleSystem,
      operationTotal
    })


    this.tick()
  }

  tick () {
    const {
      scene,
      camera,
      renderer,
      particleSystem,
      nodes,
      locations,
      speed,
      width,
      height,
      nodeGrid
    } = this.state

    let {
      currentDate
    } = this.state

    if (!renderer) {
      requestAnimationFrame(this.tick)
      return
    }

    locations.forEach(l => {
      l.update()
    })

    const attributes = particleSystem.geometry.attributes

    const gridResolution = 50
    const newNodeGrid = new Array(gridResolution)
      .fill(null)
      .map(row => new Array(gridResolution)
        .fill(null)
        .map(col => new Array())
      )


    let neighboringNodesCount = 0
    let pushedneighboringNodesCount = 0
    nodes.forEach((n, i) => {
      
      let neighboringNodes = []
      if (nodeGrid.length > 0) {
        const x1 = Math.floor((n.position.x + width / 2) / width * gridResolution)
        const y1 = Math.floor((n.position.y + height / 2) / height * gridResolution)
        for (let x = x1 - 1; x <= x1 + 1; x++) {
          for (let y = y1 - 1; y <= y1 + 1; y++) {
            if (x1 >= 0 && x1 < gridResolution && y1 >= 0 && y1 < gridResolution) {
              neighboringNodes = neighboringNodes.concat(nodeGrid[x1][y1])
            }
          }
        }
      }

      // const ratio = Math.floor(neighboringNodes.length / 20)
      const pos = n.update(currentDate, locations, neighboringNodes)
      if (!!pos) {
        // console.log(pos)
        const x = Math.floor((pos.x + width / 2) / width * gridResolution)
        const y = Math.floor((pos.y + height / 2) / height * gridResolution)
        if (x >= 0 && x < gridResolution && y >= 0 && y < gridResolution) {
          newNodeGrid[x][y].push(n)
          pushedneighboringNodesCount ++
        }

        attributes.position.array[i * 3 + 0] = pos.x
        attributes.position.array[i * 3 + 1] = pos.y
        attributes.position.array[i * 3 + 2] = pos.z
        attributes.color.array[i * 3 + 0] = n.color.r
        attributes.color.array[i * 3 + 1] = n.color.g
        attributes.color.array[i * 3 + 2] = n.color.b
      }
    })
    attributes.position.needsUpdate = true
    attributes.color.needsUpdate = true

    renderer.render(scene, camera)

    // if (Math.random() < 0.05) console.log(newNodeGrid)
    // console.log(neighboringNodesCount, pushedneighboringNodesCount)

    this.setState({
      ...this.state,
      currentDate: currentDate + speed,
      nodeGrid: newNodeGrid
    })
    
    requestAnimationFrame(this.tick)

  }

  render () {

    const {
      width,
      height,
      artworks,
      timeRange,
      locations,
      operationTotal
    } = this.state

    const locationLabels = locations.map((l, i) => {
      const theta = Math.atan2(l.position.x, l.position.y)
      const rad = l.rad * 2
      return (
        <g
          key={ `locationLabel-${i}` }
          transform={ `translate(${l.position.x + width / 2}, ${height - (l.position.y + height / 2)})` }
        >
          <line
            x1={ 0 }
            y1={ 0 }
            x2={ Math.cos(theta) * rad }
            y2={ Math.sin(theta) * rad}
            stroke={ 'rgba(255, 255, 255, 0.2)' }
          />
          <text
            fill={'white'}
            fontSize={11}
            x={ Math.cos(theta) * rad }
            y={ Math.sin(theta) * rad}
            textAnchor={ 'middle' }
            alignmentBaseline={ 'central' }
          >
            { l.id }
          </text>
        </g>
      )
      // return (

      //   <div
      //     style={{
      //       color: 'white',
      //       ,
      //       fontSize: 11,
      //       position: 'absolute'
      //     }}
      //   >
      //     
      //   </div>
      // )
    })

    return (
      <div
        className="Map"
        ref="wrapper"
      >
        <svg
          className="domOverlay"
          ref="domOverlay"
        >

          { locationLabels }
        </svg>
      </div>
    )
  }
}

export default MapApp
