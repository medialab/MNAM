/*
  legende
  overlay
  sort
  ordinates


  FEATURES
    VIZ
x     operation types
      compress layout
x     scale factor + layout
      sort by highest visibility
      ==
      add space between stopList and others
      time cursor
      zoom in time
      visualize external
    FILTERING
      only faves
    INTERACTIONS
x     overlay operation
      add and remove fav
  QUESTIONS
x   100% reliable accrochage data
  MISC
    window resize
    move width and height to props
  ISSUES
x   year labeling is offset?
    error when not filtering dates
    ==
    removed last operation
    missing artworks
    line sometimes start before first operation

*/


import React, { Component } from 'react';
import Artwork from './Artwork'
import { map, shuffleArray, lerp } from './utils'
import { cubehelix } from 'd3-color'

import './App.css';



class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      artworks: [],
      timeRange: [10000000000000, 0],
      artworkCount: 100,
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
      height: 50,
      halfDecadeRange: [2000, 2015],
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
  }

  componentWillMount () {}

  componentWillReceiveProps (props) {
    const {
      timeRange,
      artworkCount,
      stopList,
      height,
      colorCodes
    } = this.state



    const width = this.refs.timelineContainer.clientWidth

    shuffleArray(props.data)

    let colorOffset = 1
    const colorList = new Array(colorCodes.length).fill(0)
      .map((v, i) => {
        if (colorOffset === 0) colorOffset += 355 / 2
        else colorOffset = 0
        return cubehelix((Math.floor(i / colorCodes.length * 355) + colorOffset) % 355, 1, 0.5)
      })


    stopList.reverse()
      .forEach(id => {
        const artwork = props.data.find(a => a._id === id)
        if (!!artwork) {
          artwork.favorite = true
          const oldID = props.data.indexOf(artwork)
          props.data.move(oldID, 0)
        }
      })

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

    // const ealiestYear = new Date(timeRange[0]).getYear()

    const halfDecadeRange = [new Date(timeRange[0]), new Date(timeRange[1])]
    halfDecadeRange[0].setDate(1)
    halfDecadeRange[0].setMonth(0)
    halfDecadeRange[0].setYear(1900 + halfDecadeRange[0].getYear() - halfDecadeRange[0].getYear() % 5)
    halfDecadeRange[0] = 1900 + halfDecadeRange[0].getYear()
    halfDecadeRange[1].setDate(1)
    halfDecadeRange[1].setMonth(0)
    halfDecadeRange[1].setYear(1900 + halfDecadeRange[1].getYear() - halfDecadeRange[1].getYear() % 5 + 5)
    halfDecadeRange[1] = 1900 + halfDecadeRange[1].getYear()

    // timeRange[0] = prevHalfDecade.getTime()
    // timeRange[1] = nextHalfDecade.getTime()

    const processedArtworks = artworks.map(a => {
      const visibilityOperations = a.operations
        .filter(o => o.opt_code === '212I' || o.opt_code === '213I' || o.opt_code === '212E' || o.opt_code === '213E')
        .map(o => {
          const installationType = parseInt(o.opt_code.slice(0, 3)) === 212 ? 'installation' : 'uninstallation'
          return {
            date: o.date,
            type: installationType
          }
        })

      let y = 0
      let acc = 0
      let vel = 0

      const ySteps = new Array(width).fill(0)
        .map((v, i) => {
          const latestX = map(i - 1, 0, width, timeRange[0], timeRange[1])
          const x = map(i, 0, width, timeRange[0], timeRange[1])
          const pastOperations = visibilityOperations.filter(o => new Date(o.date).getTime() <= x)
          const latestOperation = pastOperations[pastOperations.length - 1]
          if (!!latestOperation && latestOperation.type === 'installation') {
            // const dist = height - y
            // const direction = dist / Math.abs(dist)
            // acc = Math.pow(Math.abs(dist), 2) * 0.00001 * direction

            // if (acc < 0) vel = lerp(vel, 0, 0.9)
            // acc = 0.002

            // y = lerp(y, height * 2, 0.1)
          } else {
            // const dist = - y
            // const direction = (dist + 1) / Math.abs(dist + 1)
            // acc = Math.pow(Math.abs(dist), 2) * 0.00001 * direction
            
            // if (acc > 0) vel = lerp(vel, 0, 0.5)
            // acc = -0.02

            // y = lerp(y, 0, 0.1)
          }
          vel += acc
          y += vel
          if (y < 0) {
            y = 0
            if (vel < 0) vel = 0
          }
          return y
        })
        .filter((y, i) => i % 5 === 0)
        .map((y, i) => {
          return {
            x: map(i, 0, Math.floor(width / 5), 0, width),
            y: y
          }
        })

      return {
        ...a,
        ySteps,
        visibilityOperations
      }
    })

    const colorBuckets = {}
    processedArtworks.forEach(a => {
      a.operations.forEach(o => {

        colorCodes.some((codes, j) => {
          if (codes.indexOf(o.opt_code) > -1) {
            if (!colorBuckets[j]) colorBuckets[j] = 0
            colorBuckets[j] ++
            return true
          } else return false
        })
        
      })
    })

    this.setState({
      ...this.state,
      artworks: processedArtworks,
      timeRange,
      halfDecadeRange,
      colorList,
      colorBuckets
    })
  }

  render() {

    const {
      artworks,
      timeRange,
      height,
      halfDecadeRange,
      colorCodes,
      colorList,
      colorBuckets,
      colorLabels
    } = this.state

    // if (artworks.length === 0) return (
    //   <div className="App"></div>
    // )

    const timelines = artworks.map((a, i) => {
      return (
        <Artwork
          key={ `artwork-${ i }` }
          color={ i * 20 }
          data={ a }
          timeRange={ timeRange }
          index={ i }
          height={ height }
          colorCodes={ colorCodes }
          colorList={ colorList }
        />
      )
    })

    // console.log('aga', halfDecadeRange, (halfDecadeRange[1] - halfDecadeRange[0])/ 5)
    const halfDecades = new Array((halfDecadeRange[1] - halfDecadeRange[0])/ 5).fill(0)
    const yearAxix = halfDecades
      .map((y, i) => {
        return halfDecadeRange[0] + i * 5
      })
      .map((y, i) => {
        const d = new Date()
        d.setYear(y)
        const x = map(d.getTime(), timeRange[0], timeRange[1], 0, document.body.clientWidth - 100) - 50 + 19
        return (
          <g
           key={ `yearlabel-${i}` }
          >
            <text
              style={{
                fill: '#8080e8',
                fontSize: 13,
                textAnchor: 'middle'
              }}
              x={ x }
              y={ 0 }
            >
              { y }
            </text>
            <line
              x1={ x }
              x2={ x }
              y1={ 25 }
              y2={ artworks.length * height + 25 }
              stroke={ '#8080e8' }
              opacity={ 0.2 }
            />
          </g>
        )
      })

    let buckets = new Array(13).fill(0)
    Object.keys(colorBuckets).forEach(key => {
      const val = colorBuckets[key]
      buckets[key] = val
    })
    const colorRanking = []
    for (let i = 0; i < buckets.length; i++){
      let maxCount = 0
      let id = -1
      buckets.forEach((b, j) => {
        if (b > maxCount) {
          id = j
          maxCount = b
        }
      })
      if (id > -1) {
        colorRanking.push(id)
        buckets[id] = 0
      }
    }
    const legend = colorRanking.map((id, i) => {
      return (
        <li
          key={`colorlabel-${i}`}
        >
          <span
            style={{
              width: 13,
              height: 13,
              backgroundColor: colorList[id].rgb()
            }}
          >
          </span>
          { colorLabels[id] }
        </li>
      )
    })

    return (
      <div className="App">
        <h1>
          ARTWORK TIMELINE
        </h1>
        <ul className="legend">
          { legend }
        </ul>
        <svg
          ref="timelineContainer"
          style={{
            width: "100%",
            height: artworks.length * height,
          }}
        >
          { yearAxix }
          { timelines }
        </svg>
      </div>
    );
  }
}

export default App;
