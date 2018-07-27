

import React, { Component } from 'react'

export default class TimePage extends Component {
  constructor (props) {
    super(props)
  }

  render () {
    const {
      artistsByYear,
      fullLayout
    } = this.props

    const artists = artistsByYear.slice(0)
    if (!artists) return null

    const timeframe = [1945, 2016]
    const widthPerYear = (window.innerWidth - 100 - 200) / (timeframe[1] - timeframe[0])

    let c = 0
    
    const yearList = Object.keys(artists
      .reduce((map, artist) => {
        if (!map[artist.firstAcquisition]) {
          map[artist.firstAcquisition] = 0
        }
        map[artist.firstAcquisition]++
        return map
      },{}))
      .map((year, i) => {
        const artistList = artists
          .filter(artist => artist.firstAcquisition === parseInt(year))
          .map((artist, i) => {
            c++
            if (c % 100 === 0) console.log(c)

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

        return (
          <li
            className="group"
            key={ `group-${i}` }
          >
            <h3>
              { year }
            </h3>
            <ul
              style={{
                marginLeft: fullLayout ? 0 : 200
              }}
            >
              { artistList }
            </ul>
          </li>
        )
      })

    return (
      <div>
        <div className="title">
          <h2>Artist Acquisition Sequences</h2>
          <h4>by year of first acquisition</h4>
        </div>
        <ul>
          {yearList}
        </ul>
      </div>
    )
  }
}