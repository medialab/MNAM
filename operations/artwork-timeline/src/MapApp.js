

/*

  trails
  projection
  better geo layout
  record
  fix target sequencing
  nodes should not pop in middle of location
  remove back and forths

  oops EXPO?

*/


import React, { Component } from 'react'
import Artwork from './Artwork'
import { map, shuffleArray, lerp, dataURItoBlob, dateToString } from './utils'
import { cubehelix } from 'd3-color'
import * as THREE from 'three'

import Node from './Node'
import Location from './Location'
import { Link } from 'react-router-dom'

import { vertexShader, fragmentShader } from './particleShaders'

import parseCSV from 'csv-parse/lib/sync'

import './App.css';

import domtoimage from 'dom-to-image'
import uploader from 'base64-image-upload'

import html2canvas from 'html2canvas'
import CanvasToTIFF from './canvas-to-tiff'


const initialState = {
  recording: false,
  recordingSessionName: dateToString(new Date()),
  artworks: [],
  timeRange: [10000000000000, 0],
  artworkCount: 1500,
  nodes: [],
  nodeGrid: [],
  locations: [],
  cities: [],
  currentDate: new Date(0),
  speed: 1000 * 60 * 60 * 24,
  width: 100,
  height: 100,
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
  colorList: [],
  segmentCount: 1000,
  frameCount: 0,
  moveTotal: 0,
  viewTypes: ['museum', 'world'],
  currentViewType: 'museum' 
}


class MapApp extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ...initialState
    }

    this.init = this.init.bind(this)
    this.tick = this.tick.bind(this)
    this.initArtworks = this.initArtworks.bind(this)
    this.initColors = this.initColors.bind(this)
    this.initTime = this.initTime.bind(this)
    this.initScene = this.initScene.bind(this)
    this.initParticleSystem = this.initParticleSystem.bind(this)
    this.initLocations = this.initLocations.bind(this)
    this.initLineSystem = this.initLineSystem.bind(this)
    this.switchViewType = this.switchViewType.bind(this)
    this.initCities = this.initCities.bind(this)
  }

  componentDidMount () {
    if (Object.keys(this.props).length > 0) this.init(this.props)
    console.log('mounted map', Object.keys(this.props).length > 0)
  }

  init (props) {
    const {
      artworkCount,
      segmentCount,
      stopList,
      colorCodes
    } = this.state

    const width = document.getElementById('root').clientWidth
    const height = document.getElementById('root').clientHeight

    const colorList = this.initColors(colorCodes)

    const exhibitions = parseCSV(props.exhibitionData)
      .slice(1)
      .filter(row => !isNaN(new Date(row[7]).getTime()) && !isNaN(new Date(row[8]).getTime()))
      .filter(row => row[4] !== 'MNAM, Centre Georges Pompidou')
      .filter(row => !!row[6] && row[6].length > 0)
      .map(row => {
        return {
          loc: (`${row[6]}`).toLowerCase(),
          city: (`${row[5]}`).toLowerCase(),
          country: (`${row[6]}`).toLowerCase(),
          lat: parseFloat(row[10]),
          lon: parseFloat(row[11])
        }
      })

    const artworks = this.initArtworks(props.data, artworkCount, exhibitions)

    const timeRange = this.initTime(artworks)

    const currentDate = timeRange[0] - 100

    const {
      scene,
      camera,
      renderer
    } = this.initScene(width, height)

    const {
      nodes,
      particleSystem
    } = this.initParticleSystem(scene, artworks, width, height)

    const {
      lineSystem
    } = this.initLineSystem(scene, segmentCount)

    const locations = this.initLocations(nodes)

    const cities = this.initCities(nodes, exhibitions)

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
      cities,
      currentDate,
      particleSystem,
      lineSystem,
      colorList
    })

    this.tick()
  }

  initTime (artworks) {
    const timeRange = [10000000000000, 0]
    timeRange[0] = artworks.reduce((a, b) => {
      const minOperations = b.operations.reduce((c, d) => {
        return Math.min(c, new Date(d.date).getTime())
      }, a)
      return Math.min(a, minOperations)
    }, timeRange[0])
    timeRange[1] = Date.now()
    return timeRange
  }

  initScene (width, height) {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera( 60, width / height, 0.1, 1000 )
    camera.position.set(0, 0, (height/2.0) / Math.tan(Math.PI*30.0/180.0))
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(width, height)
    this.refs.wrapper.appendChild(renderer.domElement)

    return {
      scene,
      camera,
      renderer
    }
  }

  initColors (colorCodes) {
    let colorOffset = 1
    return new Array(colorCodes.length).fill(0)
      .map((v, i) => {
        if (colorOffset === 0) colorOffset += 355 / 2
        else colorOffset = 0
        return cubehelix((Math.floor(i / colorCodes.length * 355 / 2) + colorOffset) % 355, 1, 0.5)
      })
  }

  initArtworks (data, artworkCount, exhibitions) {

    const countryList = []
    const cityList = []
    exhibitions.forEach(e => {
      if (countryList.indexOf(e.country) === -1) countryList.push(e.country)
      if (cityList.indexOf(e.city) === -1) cityList.push(e.city)
    })

    return data
      .slice(0)
      .sort((a, b) => b.opt_field.filter(o => o.opt_branch === 'EXPO').length - a.opt_field.filter(o => o.opt_branch === 'EXPO').length)
      .filter((d, i) => i < artworkCount / 2)
      .concat(data
        .filter((d, i) => {
          return d.opt_field.filter(o => {
            return !!o.opt_branch && o.opt_branch !== 'unknown'
          }).length > 5
        })
        .filter((d, i) => i < artworkCount / 2)
      )

      // .filter((d, i) => {
      //   return d.opt_field.filter(o => {
      //     return !!o.opt_branch && o.opt_branch === 'EXPO' 
      //   }).length > 0
      // })
      // .filter((d, i) => {
      //   return d.opt_field.filter(o => {
      //     return !!o.opt_branch && o.opt_branch !== 'unknown'
      //   }).length > 5
      // })
      // .sort((a, b) => b.opt_field.filter(o => !!o.opt_branch && o.opt_branch !== 'unknown').length - a.opt_field.filter(o => !!o.opt_branch && o.opt_branch !== 'unknown').length)
      // .sort((a, b) => b.opt_field.filter(o => o.opt_branch === 'EXPO').length - a.opt_field.filter(o => o.opt_branch === 'EXPO').length)
      // .sort((a, b) => b.opt_field.length - a.opt_field.length)
      // .filter((d, i) => i < artworkCount)
      .map(a => {
        const operations = a.opt_field
          .filter(o => {
            return new Date(o.date).getTime() >= new Date('1/1/1995').getTime()
          })
          .sort((a, b) => {
            return new Date(a.date) - new Date(b.date).getTime()
          })
          .map(o => {

            let country = null
            if (o.opt_branch === 'EXPO') {
              const detail = o.opt_detail
                .split('-Dossier')[0]
                .split('-')
                .slice(-2)
                .join('-')
                .toLowerCase()
              countryList.some(c => {
                // TODO: sort countryList by longest names
                if (detail.indexOf(c) > -1) {
                  country = c
                  return true
                } else {
                  return false
                }
              })
              if (country === null) {
                if(detail === 'moscow house of photography') country = 'usa'
                if(detail === 'états-unis') country = 'fédération de russie'
                if(detail === 'taïpei-république de chine (taïwan)') country = 'république de chine, taïwan'
                if (country === null) console.log('cant find country:', detail)
              } else {
                // console.log('hmm?', loc, detail)
              }
            }

            let city = null
            if (o.opt_branch === 'EXPO') {
              const detail = o.opt_detail
                .split('-Dossier')[0]
                // .split('-')
                // .slice(-3)
                // .join('-')
                .toLowerCase()
              cityList.some(c => {
                // TODO: sort cityList by longest names
                if (detail.indexOf(c) > -1) {
                  city = c
                  return true
                } else {
                  return false
                }
              })
              if (city === null) {
                if(detail === 'moscow house of photography') city = 'usa'
                if(detail === 'états-unis') city = 'fédération de russie'
                if(detail === 'taïpei-république de chine (taïwan)') city = 'république de chine, taïwan'
                if (city === null) console.log('cant find city:', detail)
              } else {
                // console.log('hmm?', loc, detail)
              }
            }

            return {
              ...o,
              date: new Date(o.date).getTime(),
              loc: country,
              country,
              city
            }
          })
          .filter(o => o.opt_branch !== 'EXPO' || (!!o.country && !!o.city))

        return {
          ...a,
          operations
        }
      })
  }

  initParticleSystem (scene, artworks, width, height) {
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
    return {
      nodes,
      particleSystem
    }
  }

  initLineSystem (scene, segmentCount) {
    const positions = new Array(segmentCount * 3 * 2).fill(0).map(v => 0)
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    const material = new THREE.LineBasicMaterial({color: 0x0000ff})
    const lineSystem = new THREE.LineSegments(geometry, material)
    scene.add(lineSystem)
    return {
      lineSystem
    }
  }

  initLocations (nodes) {
    const locationMap = {}
    nodes.forEach(n => {
      n.operations.forEach(o => {
        if (!locationMap[o.opt_branch]) locationMap[o.opt_branch] = 0 
        locationMap[o.opt_branch] ++
      })
    })

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
        parent.addChildren(location)
        return location
      })


    let rad = window.innerHeight / 4
    let theta = 0

    locations.forEach(l => {
      l.setFinalRad()
    })

    const allRads = locations.reduce((a, b) => a + b.finalRad, 0)

    locations
      .forEach(l => {
        const thetaOffset = l.finalRad / allRads * Math.PI * 2
        theta += thetaOffset / 2
        l.setLayout(new THREE.Vector3(0, -50, 0), theta, rad, thetaOffset)
        theta += thetaOffset / 2
      })

    return locations
  }

  initCities (nodes, exhibitions) {
    const width = window.innerWidth
    const height = window.innerHeight

    const cityMap = {}

    nodes.forEach(n => {
      n.operations
        .filter(o => !!o.city)
        .forEach(o => {
          if (!cityMap[o.city]) cityMap[o.city] = 0 
          cityMap[o.city] ++
        })
    })

    let cities = Object.keys(cityMap)
      .filter(id => !!exhibitions.find(e => e.city === id))
      .map(id => {
        const exhibition = exhibitions.find(e => e.city === id)
        const city = new Location(id, cityMap[id])
        city.displayName = id
        city.setLocation(exhibition.country, exhibition.city)
        city.setFinalRad()
        if (exhibition.city === 'moscou') {
          exhibition.lon = 37.3523184
          exhibition.lat = 55.7498598
        }
        city.setGeoLayout(
          map(exhibition.lon, -180, 180, -width / 2, width / 2),
          map(exhibition.lat, -90, 90, -height / 2, height / 2)
        )
        return city
      })
      .concat(
        new Array(1)
        .fill(0)
        .map(() => {
          const center = new Location('centre pompidou', 0)
          center.setLocation('france', 'centre pompidou')
          center.setFinalRad()
          center.displayName = 'centre pompidou'
          center.setGeoLayout(
            map(2.3500563, -180, 180, -width / 2, width / 2),
            map(48.8606455, -90, 90, -height / 2, height / 2)
          )
          return center
        })
      )

    console.log('aga', cities, cityMap)

    return cities
  }

  tick () {
    const {
      scene,
      camera,
      renderer,
      particleSystem,
      lineSystem,
      nodes,
      locations,
      cities,
      speed,
      width,
      height,
      nodeGrid,
      colorList,
      colorBuckets,
      colorCodes,
      segmentCount,
      frameCount,
      currentViewType,
      recording,
      recordingSessionName
    } = this.state

    let {
      moveTotal,
      currentDate
    } = this.state

    if (!renderer) {
      requestAnimationFrame(this.tick)
      return
    }

    if (currentViewType === 'museum') {
      locations.forEach(l => {
        l.update()
      })
    }

    if (currentViewType === 'world') {
      cities.forEach(l => {
        l.updateGeo(cities)
      })
    }

    const attributes = particleSystem.geometry.attributes

    const gridResolution = 50
    const newNodeGrid = new Array(gridResolution)
      .fill(null)
      .map(row => new Array(gridResolution)
        .fill(null)
        .map(col => new Array())
      )


    const lastMoves = []
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

      const currentLocations = currentViewType === 'museum' ? locations : cities 

      const pos = n.update(currentDate, currentLocations, neighboringNodes, colorList, colorCodes, currentViewType)
      if (!!pos) {
        const x = Math.floor((pos.x + width / 2) / width * gridResolution)
        const y = Math.floor((pos.y + height / 2) / height * gridResolution)
        if (x >= 0 && x < gridResolution && y >= 0 && y < gridResolution) {
          newNodeGrid[x][y].push(n)
          pushedneighboringNodesCount ++
        }

        const lastPos = new THREE.Vector3(attributes.position.array[i * 3 + 0], attributes.position.array[i * 3 + 1], attributes.position.array[i * 3 + 2])

        if (n.life > 1 && lastPos.distanceTo(pos) > 1.5) {
          lastMoves.push(
            lastPos.x,
            lastPos.y,
            lastPos.z,
            pos.x,
            pos.y,
            pos.z
          )
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

    const lineGeometry = lineSystem.geometry.attributes.position

    lineGeometry.array = lineGeometry.array.slice(moveTotal.length)

    // TODO: refactor
    lineGeometry.array.reverse()
    for (let i = 0; i < lineGeometry.array.length; i++) {
      if (i + lastMoves.length >= lineGeometry.array.length) {
        lineGeometry.array[i] = lastMoves[lineGeometry.array.length - i - 1]
      } else {
        lineGeometry.array[i] = lineGeometry.array[i + lastMoves.length]
      }
    }
    lineGeometry.array.reverse()

    lineGeometry.needsUpdate = true

    renderer.render(scene, camera)


    this.setState({
      ...this.state,
      currentDate: Math.min(Date.now(), currentDate + speed),
      nodeGrid: newNodeGrid,
      frameCount: frameCount + 1,
      moveTotal
    })
    
    if (recording) {
      const that = this
      const d = Date.now()

      // html2canvas(document.body).then(function(canvas) {
      //   console.log('canvasing', Date.now() - d)
      //   CanvasToTIFF.toDataURL(canvas, function(dataUrl) {
      //     console.log('tiffing', Date.now() - d)
      //     var form = new FormData(),
      //     xhr = new XMLHttpRequest()
      //     form.append('filename', `${frameCount}`)
      //     form.append('sessionName', recordingSessionName)
      //     form.append('imageData', dataUrl)
      //     xhr.open('post', 'http://localhost:8080/upload', true)
      //     xhr.send(form)
      //     xhr.addEventListener('load', (err, res) => {
      //       console.log('everything', Date.now() - d)
      //       requestAnimationFrame(that.tick)
      //     })
      //   });
      // });

      domtoimage.toPng(document.body)
        .then(function (dataUrl) {
          console.log('pnging', Date.now() - d)
          var form = new FormData(),
          xhr = new XMLHttpRequest()
          form.append('filename', `${frameCount}`)
          form.append('sessionName', recordingSessionName)
          form.append('imageData', dataUrl)
          xhr.open('post', 'http://localhost:8080/upload', true)
          xhr.send(form)
          xhr.addEventListener('load', (err, res) => {
            console.log('everything', Date.now() - d)
            requestAnimationFrame(that.tick)
          })
        })
        .catch(function (error) {
          console.error('oops, something went wrong!', error)
        })

    } else {
      requestAnimationFrame(this.tick)
    }

  }

  switchViewType (id) {
    console.log('switching', id)
    this.setState({
      ...this.state,
      currentViewType: id
    })
  }

  render () {

    const {
      width,
      height,
      nodes,
      timeRange,
      locations,
      cities,
      currentDate,
      viewTypes,
      currentViewType
    } = this.state

    const currentLocations = currentViewType === 'museum' ? locations : cities.filter(c => c.count > 0)
    const topLocations = currentViewType === 'museum' ? currentLocations : currentLocations
      .sort((a, b) => b.count - a.count)
      .filter((c, i) => i < 8 && c.count > 4)

    const locationLabels = currentLocations
      .concat(currentLocations.reduce((a, b) => a.concat(b.children), []))
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
            {
              topLocations.indexOf(l) > -1 &&
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
            }
          </g>
        )
    })

    const dateString = `${new Date(currentDate).getMonth() + 1} / ${new Date(currentDate).getYear() + 1900}`

    const controls = (
      <div
        id="controls"
        style={{
          position: 'absolute',
          top: 50,
          left: 50,
          color:  'white',
          zIndex: 2
        }}
      >
        <p>
          { 
            viewTypes.map((viewType, i) => {
              return (
                <span
                  style={{
                    paddingRight: 10,
                    marginLeft: i > 0 ? 10 : 0,
                    borderRight: i < viewTypes.length - 1 ? '1px solid #ccc' : 'none',
                    color: viewType === currentViewType ? 'white' : '#aaa',
                    cursor: 'pointer'
                  }}
                  onClick={() => { 
                    this.switchViewType(viewType)
                    nodes.forEach(n => {
                      n.switchMode(currentDate, viewType)
                    })
                    locations.forEach(l => {
                      l.count = 0
                      l.children.forEach(c => {
                        c.count = 0
                      })
                    })
                    cities.forEach(l => {
                      l.count = 0
                    })
                  }}
                  key={ `viewType-${i}` }
                >
                  { viewType }
                </span>
              )
            }) 
          }
        </p>
        <p>
          { dateString }
        </p>
      </div>
    )

    return (
      <div
        className="Map"
        ref="wrapper"
      >
        { controls }
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
