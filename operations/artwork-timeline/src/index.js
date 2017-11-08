import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();

var client = new XMLHttpRequest()
client.open('GET', process.env.PUBLIC_URL + '/data/artwork_operations.json')
client.onload = function() {
  // App initialization
  const rootElement = document.getElementById('root')
  const data = JSON.parse(client.responseText)
  ReactDOM.render(
    <App 
      data={ data }
    />,
    rootElement
  )
}
client.send()