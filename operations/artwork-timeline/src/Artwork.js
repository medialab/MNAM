import React, { Component } from 'react'
import { map, lerp, cleanupLabel } from './utils'
import line from 'svg-line'

class Artwork extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    const {
      data,
      timeRange,
      index,
    } = this.props

    const containerElement = document.querySelector('.App')
    const width = containerElement.clientWidth - 100
    const height = 50
    const originalY = index * 50

    const path = line()
      .x(d => d.x)
      .y(d => height - d.y)

    const visibilityOperations = data.visibilityOperations.slice(0)
    visibilityOperations.splice(0, 0, {date: timeRange[0], type: 'uninstallation'})
    const timelinePath = visibilityOperations
      .map((p, i) => {
        const currentOperation = visibilityOperations[i]
        const nextOperation = visibilityOperations[i + 1]
        
        const stepRange = [1000000, 0]
        data.ySteps
          .forEach((s, j) => {
            const t = map(j, 0, data.ySteps.length, timeRange[0], timeRange[1])
            if((!nextOperation && t >= currentOperation.date) || (t >= currentOperation.date && t <= nextOperation.date)) {
              if (stepRange[0] > j) stepRange[0] = j
              if (stepRange[1] < j) stepRange[1] = j
            }
          })

        const steps = data.ySteps.slice(Math.max(0, stepRange[0] - 1), stepRange[1] + 1)
        console.log(steps)

        if (steps.length === 0) return (
          <path
            key={ `artwork-${index}-segment${i}` }
          />
        )

        return (
          <path
            key={ `artwork-${index}-segment${i}` }
            d={ path(steps) }
            stroke={ currentOperation.type === 'installation' ? '#ea5a47' : '#4543dd' }
            strokeWidth={ 2 }
            fill={ 'transparent' }
          />
        )
      })


    const bubbles = data.operations
      // .filter((o, i) => i < data.operations.length -2)
      .map((o, i) => {
        const x = map(o.date, timeRange[0], timeRange[1], 0, width)
        // const y = height

        const alpha = map(o.date, timeRange[0], timeRange[1], 0, 1)

        const previousStep = Math.floor(alpha * data.ySteps.length)
        const nextStep = Math.ceil(alpha * data.ySteps.length)

        let y = height
        if (!!data.ySteps[previousStep] && !!data.ySteps[nextStep]) {
          y = lerp(data.ySteps[previousStep].y, data.ySteps[nextStep].y, map(x, data.ySteps[previousStep].x, data.ySteps[nextStep].x, 0, 1))
          // if (y < 0) y = 0
          // if (y > height) y = height
          y = height - y
        }
        if (Number.isNaN(y)) y = height

        return (
          <circle
            key={ `artwork-${index}-event${i}` }
            cx={ x }
            cy={ y }
            r={ 3 }
            fill={ o.opt_code === '212I' || o.opt_code === '213I' || o.opt_code === '212E' || o.opt_code === '213E' ? 'green' : 'red' }
          />
        )
      })

    const label = (
      <text
        style={{
          fill: '#3e3eba',
          fontSize: 13
        }}
        y={ height + 18}
      >
        {`${ cleanupLabel(data.title_notice) } - ${ cleanupLabel(data.authors_list) }`}
      </text>
    )

    console.log('woop', data)

    return (
      <g
        style={{
          transform: `translate(0, ${ originalY }px)`
        }}
      >
        { timelinePath }
        { bubbles }
        { label }
      </g>
    )
  }
}

export default Artwork