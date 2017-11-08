import React, { Component } from 'react'
import { map, lerp } from './utils'
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
    const originalY = index * 40

    const path = line()
      .x(d => d.x)
      .y(d => height - d.y)

    const timeline = (
      <path
        d={ path(data.ySteps) }
        stroke={ 'red' }
        strokeWidth={ 2 }
        fill={ 'transparent' }
      />
    )

    // console.log('wtf', data.visibilityOperations)

    const visibilityOperations = data.visibilityOperations.slice(0)
    visibilityOperations.splice(0, 0, {date: timeRange[0], type: 'uninstallation'})
    const timelinePath = visibilityOperations
      // .filter((p, i) => i < visibilityOperations.length - 1)
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
        // console.log(stepRange, data.ySteps, steps)
        
        // console.log('aga', steps)
        return (
          <path
            key={ `artwork-${index}-segment${i}` }
            d={ path(steps) }
            stroke={ `rgb(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)})` }
            strokeWidth={ 2 }
            fill={ 'transparent' }
          />
        )
      })


    // const timeline = 

    const bubbles = data.operations
      .map((o, i) => {
        const x = map(o.date, timeRange[0], timeRange[1], 0, width)
        // const y = height

        const alpha = map(o.date, timeRange[0], timeRange[1], 0, 1)

        const previousStep = Math.floor(alpha * data.ySteps.length)
        const nextStep = Math.ceil(alpha * data.ySteps.length)

        let y = height
        if (!!data.ySteps[previousStep] && !!data.ySteps[nextStep]) {
          y = lerp(data.ySteps[previousStep].y, data.ySteps[nextStep].y, map(x, data.ySteps[previousStep].x, data.ySteps[nextStep].x, 0, 1))
          if (y < 0) y = 0
          if (y > height) y = height
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

    return (
      <g
        style={{
          transform: `translate(0, ${ originalY }px)`
        }}
      >
        { timelinePath }
        { bubbles }
        }
      </g>
    )
  }
}

export default Artwork