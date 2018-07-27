

import React, { Component } from 'react'

export default class GeneralPage extends Component {
  constructor (props) {
    super(props)
  }

  render () {
    const {
      artists,
      fullLayout
    } = this.props

    if (!artists) return null

    const timeframe = [1945, 2016]
    const widthPerYear = (window.innerWidth - 100 - 200) / (timeframe[1] - timeframe[0])

    const artistList = artists.map((artist, i) => {
      if (i % 100 === 0) console.log(i)
      let offset = 0
      const sequence = artist.sequence.map((seq, j) => {
        let margin = 0
        if (seq[3] >= 1) {
          offset ++
          return null
        } else {
          margin = offset * widthPerYear
          offset = 0
        }

        return (
          <li
            key={ `artist-${i}-year-${j}` }
            className="year"
            style={{
              backgroundColor: `rgba(${seq[0] * 255},${seq[1] * 255},${seq[2] * 255},${(1 - seq[3])})`,
              marginLeft: margin,
              maxWidth: widthPerYear,
              height: fullLayout ? '100%' : 1
            }}
          >
          </li>
        )
      })

      return (
        <li
          className={`artist ${ fullLayout ? 'full' : ''}`}
          key={ `artist-${i}` }
        >
          {
            fullLayout && 
            <div className="name">
              { artist.name }
            </div>
          }
          <ul className="sequence">
            { sequence }
          </ul>
        </li>
      )
    })

    const labels = new Array(Math.floor((timeframe[1] - timeframe[0]) / 10))
      .fill(0)
      .map((a, i) => {
        return (
          <li
            key={ `label-${i}` }
            style={{
              width: widthPerYear * 10
            }}
          >
            {i * 10}
          </li>
        )
      })

    return (
      <div>
        <div className="title">
          <h2>Artist Acquisition Sequences</h2>
          <h4>general ranking</h4>
        </div>
        <ul className="labels">
          { labels }
        </ul>
        <ul
          style={{
            marginLeft: fullLayout ? 0 : 200
          }}
        >
          { artistList }
        </ul>
      </div>
    )
  }
}