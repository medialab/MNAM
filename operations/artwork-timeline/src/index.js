
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

var client = new XMLHttpRequest()
client.open('GET', process.env.PUBLIC_URL + '/data/artwork_operations.json')
// client.open('GET', process.env.PUBLIC_URL + '/data/artwork_operations_with_branch.json')
client.onload = function() {
  // App initialization
  const rootElement = document.getElementById('root')
  const data = JSON.parse(client.responseText)
  ReactDOM.render(
    (
      <Router>
        <Switch>
          <Route
            exact
            path='/'
            render={(props) => <App data={ data }/>}
          />
          <Route
            exact
            path='/timeline'
            render={(props) => <App data={ data }/>}
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
}
client.send()