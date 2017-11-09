import React, { Component } from 'react'
import { map, lerp, cleanupLabel } from './utils'
import line from 'svg-line'
import codeLabels from './codeLabels.json'


class Artwork extends Component {
  constructor (props) {
    super(props)
    this.focus = this.focus.bind(this)
    this.unfocus = this.unfocus.bind(this)
    this.state = {
      focused: -1,
      focusedOperation: null
    }
  }

  focus (x, code) {
    this.setState({
      ...this.state,
      focused: x,
      focusedOperation: code
    })
  }

  unfocus () {
    this.setState({
      ...this.state,
      focused: -1,
      focusedOperation: null
    })
  }

  shouldComponentUpdate (props) {
    // return props.active && !this.props.active
    return props.active !== this.props.active
  }

  render () {
    const {
      data,
      timeRange,
      index,
      height,
      colorCodes,
      colorList,
      active
    } = this.props

    const {
      focused,
      focusedOperation
    } = this.state

    if (!active) return null

    const containerElement = document.querySelector('.App')
    const width = containerElement.clientWidth - 100
    const originalY = (index + 1) * height

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
            if (data.operations.length < 1 || t < data.operations[0].date) return
            if((!nextOperation && t >= currentOperation.date) || (t >= currentOperation.date && t <= nextOperation.date)) {
              if (stepRange[0] > j) stepRange[0] = j
              if (stepRange[1] < j) stepRange[1] = j
            }
          })

        const steps = data.ySteps.slice(Math.max(0, stepRange[0] - 1), stepRange[1] + 1)

        if (steps.length === 0) return (
          <path
            key={ `artwork-${index}-segment${i}` }
          />
        )

        return (
          <path
            key={ `artwork-${index}-segment${i}` }
            d={ path(steps) }
            stroke={ currentOperation.type === 'installation' ? '#a9a9ff' : '#4543dd' }
            strokeWidth={ 2 }
            fill={ 'transparent' }
          />
        )
      })


    let currentStatus = 'uninstallation'
    const bubbles = data.operations
      .map((o, i) => {
        if (o.opt_code === '212I' || o.opt_code === '212E') {
          currentStatus = 'installation'
        }
        if (o.opt_code === '213I' || o.opt_code === '213E') {
          currentStatus = 'uninstallation'
        }

        const x = map(o.date, timeRange[0], timeRange[1], 0, width)
        const alpha = map(o.date, timeRange[0], timeRange[1], 0, 1)
        const previousStep = Math.floor(alpha * data.ySteps.length)
        const nextStep = Math.ceil(alpha * data.ySteps.length)
        let y = height
        if (!!data.ySteps[previousStep] && !!data.ySteps[nextStep]) {
          y = lerp(data.ySteps[previousStep].y, data.ySteps[nextStep].y, map(x, data.ySteps[previousStep].x, data.ySteps[nextStep].x, 0, 1))
          y = height - y
        }
        if (Number.isNaN(y)) y = height

        let colorIndex = 0
        colorCodes.some((codes, j) => {
          if (codes.indexOf(o.opt_code) > -1) {
            colorIndex = j
            return true
          } else return false
        })

        return (
          <rect
            key={ `artwork-${index}-event${i}` }
            x={x - 2.5}
            y={y - 4 + (currentStatus === 'installation' ? -5 : 5)}
            width={5}
            height={8}
            fill={ colorList[colorIndex].rgb() }
            onMouseOver={ () => {this.focus(x - 2.5, o.opt_code)} }
            onMouseOut={ this.unfocus }
          />
        )
      })

    const label = (
      <text
        style={{
          fill: '#8080e8',
          fontSize: 13
        }}
        y={ height - 18}
      >
        {`${!!data.favorite ? '✚ ' : ''}${ cleanupLabel(data.title_notice, 50) } - ${ cleanupLabel(data.authors_list, 35) }`}
      </text>
    )

    const overlay = focused > -1 ? 
      (
        <g
          style={{
            transform: `translate(${focused}px, 15px)`
          }}
        >
          <rect
            fill={'black'}
            width={275}
            height={20}
            x={-275/2}
          />
          <text
            fill={'white'}
            fontSize={11}
            y={14}
            textAnchor={'middle'}
          >
            { codeLabels[focusedOperation] }
          </text>
        </g>
      ) : (
        null
      )

    return (
      <g
        style={{
          transform: `translate(0, ${ originalY }px)`
        }}
      >
        { timelinePath }
        { bubbles }
        { label }
        { overlay }
      </g>
    )
  }
}

export default Artwork