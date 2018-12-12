

import React, { Component } from 'react'

export default class DelayPage extends Component {
  constructor (props) {
    super(props)
  }

  render () {
    const {
      delaysByAcquisition,
      fullLayout
    } = this.props

    const timeframe = [1945, 2015]
    const widthPerYear = (window.innerWidth - 100 - 200) / (timeframe[1] - timeframe[0])
    
    // console.log('aga', delaysByAcquisition)

    const yearList = delaysByAcquisition
      .map((year, i) => {

        const acquisitionList = year
          .map((distribution, j) => {
            
            const delays = distribution.map((volume, k) => {
              return (
                <li
                  className="volume"
                  key={ `group-${i}-distribution-${j}-volume-${k}`}
                  style={{
                    width: 5,
                    height: volume,
                    marginRight: 1,
                    backgroundColor: 'blue'
                  }}
                >
                </li>
              )
            })

            return (
              <li
                className="distribution"
                key={ `group-${i}-distribution-${j}`}
                style={{
                  marginRight: 10,
                  borderBottom: '1px solid blue',
                }}
              >
                <ul
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end'
                  }}
                >
                  { delays }
                </ul>
              </li>
            )
          })

        return (
          <li
            className="group"
            key={ `group-${i}` }
            style={{
              marginBottom: 10
            }}
          >
            <div
              style={{
                display: 'flex'
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginRight: 15
                }}
              >
                { i + 1945 }
              </h3>
              <ul
                style={{
                  display: 'flex',
                  alignItems: 'flex-end'
                }}
              >
                { acquisitionList }
              </ul>
            </div>
          </li>
        )
      })

    return (
      <div>
        <div className="title">
          <h2>Artist delay between acquisitions</h2>
          <h4>by year of first acquisition</h4>
        </div>
        <ul>
          { yearList }
        </ul>
      </div>
    )
  }
}