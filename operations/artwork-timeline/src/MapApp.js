/*


*/


import React, { Component } from 'react';
import Artwork from './Artwork'
import { map, shuffleArray, lerp } from './utils'
import { cubehelix } from 'd3-color'
import * as THREE from 'three'

import './App.css';



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
      ]
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

    console.log(window.innerWidth, window.innerHeight)

    var geometry = new THREE.CircleGeometry( 100, 32 )
    var material = new THREE.MeshBasicMaterial( { color: 0xffff00, side:THREE.DoubleSide } )
    var circle = new THREE.Mesh( geometry, material )
    scene.add( circle )

    this.setState({
      ...this.state,
      timeRange,
      width,
      height,
      scene,
      camera,
      renderer
    })

    this.tick()
  }

  tick () {
    const {
      scene,
      camera,
      renderer
    } = this.state

    if (!renderer) {
      requestAnimationFrame(this.tick)
      return
    }

    renderer.render(scene, camera)
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
