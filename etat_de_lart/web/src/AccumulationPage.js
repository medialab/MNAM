

import React, { Component } from 'react'
import { map } from './utils'
import { hcl } from 'd3-color'

export default class DelayDensePage extends Component {
  constructor (props) {
    super(props)
  }

  render () {
    const {
      accumulation
    } = this.props

    const timeframe = [1945, 2015]
    const width = Math.min(1024, document.body.getBoundingClientRect().width - 100 - 18)
    const yearHeight = 10
    const height = (timeframe[1] - timeframe[0]) * 10

    const years = accumulation.map((year, i) => {
      
      const totalDelay = year.reduce((total, delay) => total + delay, 0)
      let x = 0

      const acquisitions = year.map((acquisition, j) => {
        const w = acquisition * 10
        const acquisitionX = x
        let h = j / 10 * 360
        if (j%2 === 0) h += 90
        if (h >= 180) h -= 180
        x += w
        return (
          <rect
            key={ `accumulation-year-${i}-acqusition-${j}`}
            x={ acquisitionX }
            y={ 0 }
            width={ w }
            height={ yearHeight - 0.5 }
            fill={ hcl(h, 75, 80).hex() }
          />
        )
      })
      
      return (
        <g
          key={ `accumulation-year-${i}` }
          transform={ `translate(0, ${i * yearHeight})` }
        >
          { acquisitions }
        </g>
      )
    })

    const labels = null

    return (
      <div
        style={{
          position: 'relative'
        }}
      >
        <div className="title">
          <h2>Accumulation</h2>
        </div>
        <div
          style={{
            position: 'absolute',
            fontSize: 10
          }}
        >
          { labels }
        </div>
        <svg
          style={{
            width,
            height,
          }}
        >
          { years }
        </svg>
      </div>
    )
  }
}