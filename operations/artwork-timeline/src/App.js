/*

  FEATURES
    VIZ
      color bubbles
      time cursor
      visualize external
      operation types
      size factor + layout
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
      artworkCount: 10
    }
  }

  componentWillMount () {}

  componentWillReceiveProps (props) {
    const {
      timeRange,
      artworkCount
    } = this.state


    const width = this.refs.timelineContainer.clientWidth

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
      timeRange
    } = this.state

    const timelines = artworks.map((a, i) => {
      return (
        <Artwork
          key={ `artwork-${ i }` }
          color={ i * 20 }
          data={ a }
          timeRange={ timeRange }
          index={ i }
        />
      )
    })

    return (
      <div className="App">
        <h1>
          Artwork timeline
        </h1>
        <svg
          ref="timelineContainer"
          style={{
            width: "100%",
            height: 500,
          }}
        >
          { timelines }
        </svg>
      </div>
    );
  }
}

export default App;
