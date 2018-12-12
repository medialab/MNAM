
import React, { Component } from 'react'
import { csv } from 'd3-request'
import { hcl, rgb } from 'd3-color'

import DistributionGraph from './DistributionGraph'

export default class AgeDistributionPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      fnacData: null,
      fnacNewcomersData: null,
      momaData: null,
      momaNewcomersData: null,
      newcomersFnac: false,
      newcomersMnam: false,
      newcomersMoma: false
    }

    this.parseData = this.parseData.bind(this)
  }

  componentDidMount () {
    const fnacDistributionPath = `${process.env.PUBLIC_URL}/data/fnac_3d_age.csv`
    const fnacNewcomersDistributionPath = `${process.env.PUBLIC_URL}/data/fnac_3d_newComers_age.csv`
    const momaDistributionPath = `${process.env.PUBLIC_URL}/data/moma_3d_age.csv`
    const momaNewcomersDistributionPath = `${process.env.PUBLIC_URL}/data/moma_3d_newComers_age.csv`

    // const momaDistributionPath = `${process.env.PUBLIC_URL}/data/fnac_3d_age.csv`

    csv(fnacDistributionPath, (error, fnacDistributionData) => {
      if (error) {
        throw error
      }

      csv(fnacNewcomersDistributionPath, (error, fnacNewcomersDistributionData) => {
        if (error) {
          throw error
        }

        csv(momaDistributionPath, (error, momaDistributionData) => {
          if (error) {
            throw error
          }

          csv(momaNewcomersDistributionPath, (error, momaNewcomersDistributionData) => {
            if (error) {
              throw error
            }

            // csv(momaDistributionPath, (error, momaDistributionData) => {
            const fnacData = this.parseData(fnacDistributionData)
            const fnacNewcomersData = this.parseData(fnacNewcomersDistributionData)

            const momaData = this.parseData(momaDistributionData)
            const momaNewcomersData = this.parseData(momaNewcomersDistributionData)
            //   const momaData = this.parseData(momaDistributionData).slice(0, -2)

            this.setState({
              ...this.state,
              fnacData,
              fnacNewcomersData,
              momaData,
              momaNewcomersData
            })
          })
        })
      })
    })
  }

  parseData (distributionData) {
    const dataRaw = distributionData
      .slice(1)
      .filter(data => parseInt(data.year) >= 1945)
      .map(data => {
        const distribution = []
        data.distribution.slice(1, -1).split(' ').join('').split(',')
          .map(keyVal => {
            return keyVal.split(':').map((v, i) => {
              if (i === 0) return parseInt(v)
              else return parseFloat(v)
            })
          })
          .filter(keyVal => keyVal[0] > 0 && keyVal[0] < 100)
          .forEach(keyVal => {
            distribution[keyVal[0]] = keyVal[1]
          })

        const year = parseInt(data.year)

        delete data.distribution
        return {
          year,
          distribution
        }
      })
      .sort((y1, y2) => y1.year - y2.year)

    // console.log(dataRaw.map(raw => raw.year))

    const maxSeniority = dataRaw.reduce((max, year) => Math.max(max, year.distribution.length), 0)
    dataRaw.forEach(year => {
      for (let i = 0; i < maxSeniority; i++) {
        if (!year.distribution[i]) year.distribution[i] = 0
      }
    })

    const data = dataRaw.map(year => year.distribution)
    return data
  }

  render () {
    const {
      fnacData,
      fnacNewcomersData,
      momaData,
      momaNewcomersData,
      newcomersFnac,
      newcomersMoma
    } = this.state

    if (!fnacData) return null

    return (
      <div
        className='page'
      >
        <div className='graph'>
          <ul
            className='buttons'
            style={{
              flexDirection: 'row-reverse'
            }}
          >
            <li
              onClick={(event) => {
                this.setState({
                  ...this.state,
                  newcomersFnac: !this.state.newcomersFnac
                })
              }}
            >
              { newcomersFnac ? 'All artists' : 'New Artists' }
            </li>
          </ul>
          <DistributionGraph
            data={[fnacData, fnacNewcomersData]}
            geometryIndex={newcomersFnac ? 0 : 1}
          />
        </div>
        <div className='graph'>
          <ul
            className='buttons'
            style={{
              flexDirection: 'row-reverse'
            }}
          >
            <li
              onClick={(event) => {
                this.setState({
                  ...this.state,
                  newcomersMoma: !this.state.newcomersMoma
                })
              }}
            >
              { newcomersMoma ? 'All artists' : 'New Artists' }
            </li>
          </ul>
          <DistributionGraph
            data={[momaData, momaNewcomersData]}
            geometryIndex={newcomersMoma ? 0 : 1}
          />
        </div>
      </div>
    )
  }
}
