

import React, { Component } from 'react'
import DistributionGraph from './DistributionGraph'

export default class CollectionPage extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    const {
      seniority,
      fnacData,
      mnamData,
      momaData
    } = this.props

    return (
      <div
        className="page"
      >
        <DistributionGraph
          data={ this.props.fnacData }
        />
        <DistributionGraph
          data={ this.props.mnamData }
        />
        <DistributionGraph
          data={ this.props.momaData }
        />
      </div>
    )
  }
}