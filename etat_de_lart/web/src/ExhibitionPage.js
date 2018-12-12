
import React, { Component } from 'react'
import { map } from './utils'
import { interpolateViridis } from 'd3-scale-chromatic'
import { rgb } from 'd3-color'

export default class ExhibitionPage extends Component {
  render () {
    const {
      denseDelay,
      denseDelayMNAM,
      denseDelayMOMA
    } = this.props

    if (!denseDelay) {
      return null
    }

    const width = window.innerWidth - 200
    const height = width

    const museums = [denseDelay, denseDelayMNAM, denseDelayMOMA].map((data, k) => {
      const maxDelay = Math.min(70, Math.max(...data.map(delay => delay.max)))
      const maxTotal = Math.max(...data.map(delay => delay.total))

      const delays = data.map((delay, i) => {
        const x = i / data.length * width
        const w = width / data.length

        const hex = interpolateViridis(delay.total / maxTotal)
        const c1 = rgb(hex).darker(0.5)
        const c2 = rgb(hex).brighter(1)

        return (
          <g
            key={`average-delay-${i}`}
            transform={`translate(${x})`}
          >
            <line
              x1={(w - 1) / 2}
              x2={(w - 1) / 2}
              y1={map(delay.max, 1, maxDelay, height, 0)}
              y2={map(delay.min, 1, maxDelay, height, 0)}
              stroke={`rgb(${c2.r}, ${c2.g}, ${c2.b})`}
            />
            <rect
              y={map(delay.thirdQuartile, 1, maxDelay, height, 0)}
              width={w - 1}
              height={map(delay.secondQuartile, 1, maxDelay, height, 0) - map(delay.thirdQuartile, 0, maxDelay, height, 0)}
              fill={`rgb(${c2.r}, ${c2.g}, ${c2.b})`}
            />
            <line
              x2={w - 1}
              y1={map(delay.mean, 1, maxDelay, height, 0)}
              y2={map(delay.mean, 1, maxDelay, height, 0)}
              stroke={`rgb(${c1.r}, ${c1.g}, ${c1.b})`}
            />
          </g>
        )
      })

      const labels = new Array(Math.ceil(maxDelay / 5))
        .fill(0)
        .map((v, i) => {
          v = i * 5
          let top = map(i * 5, 1, maxDelay, height, 0)
          if (top > height) top = height
          return (
            <div
              style={{
                position: 'absolute',
                transform: 'translate(-100%, -50%)',
                paddingRight: 10,
                top,
                left: 0
              }}
            >
              { Math.max(v, 1) }
            </div>
          )
        })

      return (
        <div
          key={`museum-${k}`}
        >
          <h4
            style={{
              marginTop: 50,
              marginBottom: 20
            }}
          >
            { `${k === 0 ? 'FNAC' : k === 1 ? 'MNAM' : 'MOMA'}` }
          </h4>
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
              borderBottom: '1px solid black',
              borderLeft: '1px solid black'
            }}
          >
            { delays }
          </svg>
        </div>
      )
    })

    return (
      <div
        style={{
          position: 'relative'
        }}
      >
        <div className='title'>
          <h2>Average elapsed years between 2 acquisitions</h2>
        </div>
        { museums }
      </div>
    )
  }
}
