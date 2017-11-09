/*


*/


import React, { Component } from 'react';
import Artwork from './Artwork'
import { map, shuffleArray, lerp } from './utils'
import { cubehelix } from 'd3-color'

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

    // shuffleArray(props.data)

    // stopList.reverse()
    //   .forEach(id => {
    //     const artwork = props.data.find(a => a._id === id)
    //     if (!!artwork) {
    //       artwork.favorite = true
    //       const oldID = props.data.indexOf(artwork)
    //       props.data.move(oldID, 0)
    //     } else {
    //       // console.log(id)
    //     }
    //   })


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

    this.setState({
      ...this.state,
      timeRange,
      width,
      height
    })
  }

  render() {

    const {
      width,
      height,
      artworks,
      timeRange,
    } = this.state


    return (
      <div
        className="Map"
      >
        <h1>Artwork map</h1>
      </div>
    );
  }
}

export default MapApp;
