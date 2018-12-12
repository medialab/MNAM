

import React, { Component } from 'react'
import MorphologyGraph from './MorphologyGraph'

export default class CollectionPage extends Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    const {
      morphologyFNAC,
      morphologyMNAM,
      morphologyMOMA
    } = this.props

    return (
      <div
        className="page"
      >
        <MorphologyGraph
          data={ morphologyFNAC }
        />
        <MorphologyGraph
          data={ morphologyMNAM }
        />
        <MorphologyGraph
          data={ morphologyMOMA }
        />
      </div>
    )
  }
}