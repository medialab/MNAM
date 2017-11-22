
/*

  oops EXPO?
  don't swing by when spawning
  color coding
  legend

  sort colors in locations
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
import { Link } from 'react-router-dom'

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


const initialState = {
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
  operationTotal: 0,
  colorCodes: 
    [['210I','211I','212I','213I','214I','215I','216I','220I','221I','241I','242I','260I','261I','262I','270I','271I','299I','730I','740I','750I','760I'],
    ['210E','211E','212E','213E','216E','220E','221E','230E','240E','241E','242E','244E','250E','260E','261E','262E','270E','280E','281E','282E','290E','299E','730E','740E','750E','760E'],
    ['301','302','303','304','305','306','307','308','310'],
    ['321','322'],
    ['410','420','431','432'],
    ['510','520'],
    ['710','720'],
    ['900','910','911','912','913','920','921','922','930','931','940','970','971','972','973','974','980','990'],
    ['790','800','810','811','820','821','850','890','891','892'],
    ['600','610','620','625','630','650','660','680'],
    ['700','770','771','772','960'],
    ['950'],
    ['901']],
  colorLabels: [
    'Déplacement vers localisation interne',
    'Déplacement vers localisation externe',
    'Constat oeuvre',
    'Intervention oeuvre',
    'Fiche technique - habillage',
    'Fiche technique - emballage',
    'Courriers',
    'Opérations diverses',
    'Perte ou vol',
    'Photographies',
    'Récolement',
    'Evaluation valeurs d\'assurance',
    'Inventaire réglementaire'
  ],
  colorList: [],
  colorBuckets: {}
}


class MapApp extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ...initialState
    }

    this.init = this.init.bind(this)
    this.tick = this.tick.bind(this)
  }

  componentDidMount () {
    if (Object.keys(this.props).length > 0) this.init(this.props)
    console.log('mounted map', Object.keys(this.props).length > 0)
  }


  init (props) {
    const {
      timeRange,
      artworkCount,
      stopList,
      colorCodes
    } = this.state

    const width = document.getElementById('root').clientWidth
    const height = document.getElementById('root').clientHeight

    let colorOffset = 1
    const colorList = new Array(colorCodes.length).fill(0)
      .map((v, i) => {
        if (colorOffset === 0) colorOffset += 355 / 2
        else colorOffset = 0
        return cubehelix((Math.floor(i / colorCodes.length * 355 / 2) + colorOffset) % 355, 1, 0.5)
      })

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
        if (!!o.opt_branch && o.opt_branch !== 'unknown') {
          operationTotal ++
        }
      })
    })
    console.log('locationMap', locationMap)

    // let theta = 0
    let locations = Object.keys(locationMap)
      .filter(l => l !== 'unknown' && l.indexOf('_') === -1)
      .map(l => {
        const location = new Location(l, locationMap[l])
        console.log('oook', l)
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

    locations = [
      locations.find(l => l.id === 'CPPUB'),
      locations.find(l => l.id === 'CPINTER'),
      locations.find(l => l.id === 'PN'),
      locations.find(l => l.id === 'DEPOT'),
      locations.find(l => l.id === 'EXPO'),
    ]

    Object.keys(locationMap)
      .filter(l => l.indexOf('_') > -1)
      .forEach(l => {
        const parent = locations.find(p => p.id === l.split('_')[0])
        const location = new Location(l, locationMap[l])
        // console.log('mop', l, locationMap[l])
        parent.addChildren(location)
        return location
      })


    let rad = window.innerHeight / 4
    // let theta = -Math.PI / 2
    let theta = 0

    locations.forEach(l => {
      l.setFinalRad()
    })

    const allRads = locations.reduce((a, b) => a + b.finalRad, 0)

    locations
      // .sort((a, b) => b.finalRad - a.finalRad)
      .forEach(l => {

        const thetaOffset = l.finalRad / allRads * Math.PI * 2
        theta += thetaOffset / 2
        l.setLayout(new THREE.Vector3(0, -50, 0), theta, rad, thetaOffset)
        theta += thetaOffset / 2
      })

    const currentDate = timeRange[0] - 100

    const colorBuckets = {}
    nodes.forEach(n => {
      n.operations.forEach(o => {
        colorCodes.some((codes, j) => {
          if (codes.indexOf(o.opt_code) > -1) {
            if (!colorBuckets[j]) colorBuckets[j] = 0
            colorBuckets[j] ++
            return true
          } else return false
        })
      })
    })

    console.log('test', colorList.map(c => c.rgb()))

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
      operationTotal,
      colorList,
      colorBuckets
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
      nodeGrid,
      colorList,
      colorBuckets,
      colorCodes
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
            if (x >= 0 && x < gridResolution && y >= 0 && y < gridResolution) {
              neighboringNodes = neighboringNodes.concat(nodeGrid[x][y])
            }
          }
        }
      }

      const pos = n.update(currentDate, locations, neighboringNodes, colorList, colorCodes)
      if (!!pos) {
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


    this.setState({
      ...this.state,
      currentDate: Math.min(Date.now(), currentDate + speed),
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
      operationTotal,
      currentDate
    } = this.state

    // console.log('aga', locations.reduce((a, b) => a.concat(b.children), []))

    const locationLabels = locations
      .concat(locations.reduce((a, b) => a.concat(b.children), []))
      .map((l, i) => {
        const theta = Math.atan2(l.position.x, l.position.y)
        const rad = l.rad + 10
        const x = l.position.x + width / 2
        const y = height - (l.position.y + height / 2)
        return (
          <g
            key={ `locationLabel-${i}` }
            transform={ `translate(${x}, ${y})` }
          >
            {
              l.children.length === 0 &&
              <circle
                cx={ 0 }
                cy={ 0 }
                r={ rad }
                stroke={ 'rgba(255, 255, 255, 0.4)' }
                fill={ 'transparent' }
              />
            }
            { !!l.parent &&
              (
                <line
                  x1={ 0 }
                  y1={ 0 }
                  x2={ l.parent.position.x - x + width / 2 }
                  y2={ height - (l.parent.position.y + height / 2)  - y }
                  stroke={ 'rgba(255, 255, 255, 0.4)' }
                />
              )
            }
            <text
              fill={'white'}
              fontSize={ l.children.length === 0 && !!l.parent ? 11 : 16 }
              x={ l.children.length === 0 && !!l.parent ? Math.cos(theta) * rad : 0 }
              y={ l.children.length === 0 && !!l.parent ? Math.sin(theta) * rad : 0 + (l.children.length === 0 && !!l.parent ? 0 : 20) }
              textAnchor={ 'middle' }
              alignmentBaseline={ 'central' }
            >
              { l.displayName }
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

    const dateString = `${new Date(currentDate).getMonth() + 1} / ${new Date(currentDate).getYear() + 1900}`
    const counter = (
      <text
        fill={`white`}
        x={ 50 }
        y={ 50 }
      >
        { dateString }
      </text>
    )

    return (
      <div
        className="Map"
        ref="wrapper"
      >
        <svg
          className="domOverlay"
          ref="domOverlay"
        >
          { counter }
          { locationLabels }
        </svg>
      </div>
    )
  }
}

export default MapApp
