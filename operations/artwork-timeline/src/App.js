/*

  FEATURES
    VIZ
      change physics
      zoom in time
      start timeline at acquisition
      scroll through sample
      operation types
      time cursor
      size factor + layout
      visualize external
    FILTERING
    INTERACTIONS
      overlay operation
  QUESTIONS
    100% reliable accrochage data
  MISC
    window resize
    move width and height to props
  ISSUES
    removed last operation
    missing artworks

*/


import React, { Component } from 'react';
import Artwork from './Artwork'
import { map } from './utils'

import './App.css';



class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      artworks: [],
      timeRange: [10000000000000, 0],
      artworkCount: 11,
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
      height: 50
    }
  }

  componentWillMount () {}

  componentWillReceiveProps (props) {
    const {
      timeRange,
      artworkCount,
      stopList
    } = this.state


    const width = this.refs.timelineContainer.clientWidth

    function shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
      }
    }

    // shuffle(props.data)


    const artworks = props.data
      .filter(d => {
        if (stopList.indexOf(d._id) > -1) console.log('aga')
        return stopList.indexOf(d._id) > -1
      })
      .filter((d, i) => i < artworkCount)
      .map(a => {
        const operations = a.opt_field
          .filter(o => {
            return new Date(o.date).getTime() >= new Date('1/1/1980').getTime()
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

    timeRange[1] = artworks.reduce((a, b) => {
      const maxOperations = b.operations.reduce((c, d) => {
        return Math.max(c, new Date(d.date).getTime())
      }, a)
      return Math.max(a, maxOperations)
    }, timeRange[1])

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
            acc = 0.002
            // y ++
            // y = Math.min(50, y + 1)
          } else {
            acc = -0.02
            // y --
            // y = Math.max(0, y - 1)
          }
          vel += acc
          y += vel
          if (y < 0) {
            y = 0
            if (vel < 0) vel = 0
          }
          acc = 0
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

    this.setState({
      ...this.state,
      artworks: processedArtworks,
      timeRange
    })
  }

  render() {

    const {
      artworks,
      timeRange,
      height
    } = this.state

    const timelines = artworks.map((a, i) => {
      return (
        <Artwork
          key={ `artwork-${ i }` }
          color={ i * 20 }
          data={ a }
          timeRange={ timeRange }
          index={ i }
          height={ height }
        />
      )
    })

    return (
      <div className="App">
        <h1>
          ARTWORK TIMELINE
        </h1>
        <svg
          ref="timelineContainer"
          style={{
            width: "100%",
            height: artworks.length * height,
          }}
        >
          { timelines }
        </svg>
      </div>
    );
  }
}

export default App;
