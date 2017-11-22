
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import MapApp from './MapApp';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'


// import { Router, Route, IndexRoute } from 'react-router'

document.scrollTop = 0
document.body.scrollTop = 0
document.querySelector('#root').scrollTop = 0

registerServiceWorker();

var client1 = new XMLHttpRequest()
var client2 = new XMLHttpRequest()
client1.open('GET', process.env.PUBLIC_URL + '/data/artwork_operations_with_branch.json')
client1.onload = function() {
  // client2.open('GET', process.env.PUBLIC_URL + '/data/artwork_operations.json')
  // client2.onload = function() {
    // App initialization
    const rootElement = document.getElementById('root')
    const data = JSON.parse(client1.responseText)
    // const timelineData = JSON.parse(client2.responseText)
    const timelineData = {}
    ReactDOM.render(
      (
        <Router>
          <Switch>
            <Route
              exact
              path='/'
              render={(props) => <App data={ timelineData }/>}
            />
            <Route
              exact
              path='/timeline'
              render={(props) => <App data={ timelineData }/>}
            />
            <Route
              exact
              path='/map'
              render={(props) => <MapApp data={ data }/>}
            />
          </Switch>
        </Router>
      ),
      rootElement
    )
  // }
  // client2.send()
}
client1.send()