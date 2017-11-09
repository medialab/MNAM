/*

  forces
  playback
  location queues
  sous-locations
  color coding

*/


import React, { Component } from 'react'
import Artwork from './Artwork'
import { map, shuffleArray, lerp } from './utils'
import { cubehelix } from 'd3-color'
import * as THREE from 'three'

import Node from './Node'

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
      artworkCount: 1000,
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
      locations: [],
      currentDate: new Date(0),
      speed: 1000*60*60*24
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

    timeRange[0] = artworks.reduce((a, b) => {
      const minOperations = b.operations.reduce((c, d) => {
        return Math.min(c, new Date(d.date).getTime())
      }, a)
      return Math.min(a, minOperations)
    }, timeRange[0])

    timeRange[1] = Date.now()


    // THREE.js

    var scene = new THREE.Scene()
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
    camera.position.set(0, 0, (height/2.0) / Math.tan(Math.PI*35.0 / 180.0))
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    var renderer = new THREE.WebGLRenderer()
    renderer.setSize( window.innerWidth, window.innerHeight )
    this.refs.wrapper.appendChild( renderer.domElement )

    // var geometry = new THREE.CircleGeometry( 100, 32 )
    // var material = new THREE.MeshBasicMaterial( { color: 0xffff00, side:THREE.DoubleSide } )
    // var circle = new THREE.Mesh( geometry, material )
    // scene.add( circle )

    // const nodes = artworks.map((a, i) => {
    //   return new Node(a, scene, width, height)
    // })

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

    const locationMap = {}
    nodes.forEach(n => {
      n.operations.forEach(o => {
        if (!locationMap[o.opt_branch]) locationMap[o.opt_branch] = 0 
        locationMap[o.opt_branch] ++
      })
    })
    console.log('aga', locationMap)

    let theta = 0
    let rad = 300
    console.log('aga')
    const locations = Object.keys(locationMap).map(l => {
      const location = locationMap[l]
      const geometry = new THREE.CircleGeometry(50, 32)
      const material = new THREE.MeshBasicMaterial({color: 0xff0000})
      const circle = new THREE.Mesh(geometry, material)
      circle.position.set(Math.cos(theta) * rad, Math.sin(theta) * rad, 0)
      circle.locationId = l
      scene.add(circle)
      theta += Math.PI * 2 / Object.keys(locationMap).length
      return circle
    })

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
      particleSystem
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
      speed
    } = this.state

    let {
      currentDate
    } = this.state

    if (!renderer) {
      requestAnimationFrame(this.tick)
      return
    }

    const attributes = particleSystem.geometry.attributes

    nodes.forEach((n, i) => {
      n.update(currentDate, locations, nodes)
      attributes.position.array[i * 3 + 0] = n.position.x
      attributes.position.array[i * 3 + 1] = n.position.y
      attributes.position.array[i * 3 + 2] = n.position.z
    })
    attributes.position.needsUpdate = true

    renderer.render(scene, camera)
    
    this.setState({
      ...this.state,
      currentDate: currentDate + speed
    })
    
    requestAnimationFrame(this.tick)

  }

  render () {

    const {
      width,
      height,
      artworks,
      timeRange,
    } = this.state


    return (
      <div
        className="Map"
        ref="wrapper"
      >
      </div>
    )
  }
}

export default MapApp
