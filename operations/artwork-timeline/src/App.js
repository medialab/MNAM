import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      data: []
    }
  }

  componentWillMount () {}

  componentWillReceiveProps (props) {
    console.log('wow', props)

    const data = props.data
      .filter((d, i) => i < 10)

    this.setState({
      ...this.state,
      data
    })
  }

  render() {

    const {
      data
    } = this.state

    const artworks = data.map((a, i) => {
      return (
        <svg
          style={{
            width: '100%',
            height: 50,
            backgroundColor: `rgb(${i * 20}, 0, 0)`
          }}
        >
        </svg>
      )
    })

    return (
      <div className="App">
        <h1>
          Artwork timeline
        </h1>
        <p className="App-intro">
          Hello world
        </p>
          { artworks }
      </div>
    );
  }
}

export default App;
