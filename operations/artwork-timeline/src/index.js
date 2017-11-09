
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { HashRouter, Switch, Route, Link } from 'react-router-dom'


// import { Router, Route, IndexRoute } from 'react-router'

document.scrollTop = 0
document.body.scrollTop = 0
document.querySelector('#root').scrollTop = 0

registerServiceWorker();

var client = new XMLHttpRequest()
client.open('GET', process.env.PUBLIC_URL + '/data/artwork_operations.json')
client.onload = function() {
  // App initialization
  const rootElement = document.getElementById('root')
  const data = JSON.parse(client.responseText)
  ReactDOM.render(
    (
      <HashRouter>
        <Switch>
          <Route 
            path='/'
            render={(props) => <App data={ data }/>} 
          />
          <Route 
            path='/timeline'
            render={(props) => <App data={ data }/>} 
          />
          <Route 
            path='/map'
            render={(props) => <App data={ data }/>} 
          />
        </Switch>
      </HashRouter>
    ),
    rootElement
  )
}
client.send()