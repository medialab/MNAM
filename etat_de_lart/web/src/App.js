/*

  x distribution domaines
  x align time properly
  x display artists
  x sort by domain
  x highlight year/artist
  x taller blocks based on volume
  x gallery dates
  x split blocks by mode
  x sort artists by first acquisition within gallery
    age des artistes
    activité artiste hors gallerie
    export graphics
    filter/réorganiser galleries 

  COLLECTION/ARCHIVE
    artist trail
    sub lines
    actual log scale
    update labels on same frame as camera updates
*/


import React, { Component } from 'react';
import { csv } from 'd3-request'

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import GeneralPage from './GeneralPage'
import TimePage from './TimePage'
import TypePage from './TypePage'
import ProvenancePage from './ProvenancePage'
import CollectionPage from './CollectionPage'

import { chunk } from './utils'
import Artist from './Artist'

import './App.css';


export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      artists: null,
      fullLayout: true,
      currentPage: window.location.pathname,
      dataFnac: null,
      dataMnam: null,
      dataMoma: null
    }
    this.toggleLayout = this.toggleLayout.bind(this)
    this.setCurrentPage = this.setCurrentPage.bind(this)
    this.parseData = this.parseData.bind(this)
  }

  parseData (distributionData) {
    const dataRaw = distributionData
      .slice(1)
      .filter(data => parseInt(data.year) >= 1945)
      .map(data => {
        const distribution = []
        data.ditributions.slice(1, -1).split(' ').join('').split(',').forEach(keyVal => {
          const v = keyVal.split(':').map((v, i) => {
            if (i === 0) return parseInt(v)
            else return parseFloat(v)
          })
          distribution[v[0]] = v[1]
        })

        const year = parseInt(data.year)

        delete data.ditributions
        return {
          year,
          distribution
        }
      })
      .sort((y1, y2) => y1.year - y2.year)

    const maxFnacSeniority = dataRaw.reduce((max, year) => Math.max(max, year.distribution.length), 0)
    dataRaw.forEach(year => {
      for (let i = 0; i < maxFnacSeniority; i++) {
        if (!year.distribution[i]) year.distribution[i] = 0
      }
    })
    const data = dataRaw.map(year => year.distribution)
    // console.log(data.join('\n'))
    return data
  }

  componentDidMount () {
    const artworksPath = `${process.env.PUBLIC_URL}/data/uniq_artworks.csv`
    
    const fnacDistributionPath = `${process.env.PUBLIC_URL}/data/fnac_acquisition_distri.csv`
    const mnamDistributionPath = `${process.env.PUBLIC_URL}/data/mnam_acquisition_distri.csv`
    const momaDistributionPath = `${process.env.PUBLIC_URL}/data/moma_acquisition_distri.csv`
    
    csv(fnacDistributionPath, (error, fnacDistributionData) => {
      csv(mnamDistributionPath, (error, mnamDistributionData) => {
        csv(momaDistributionPath, (error, momaDistributionData) => {

          const fnacData = this.parseData(fnacDistributionData)
          const mnamData = this.parseData(mnamDistributionData).slice(0, -1)
          const momaData = this.parseData(momaDistributionData).slice(0, -2)
          
          csv(artworksPath, (error, artworkData) => {
            if (error) {
              return console.log('error loading data:', error)
            }

            ////////////////////////////////////

            const artworks = artworkData
              // .filter(artwork => parseInt(artwork['acquisition_year']) > 1700)
              // .filter(artwork => artwork['acquisition_mode'].toLowerCase().indexOf('achat') > -1)

            const artistMap = {}
            let com = 0
            let esp = 0
            artworks.forEach(artwork => {
              const year = parseInt(artwork['acquisition_year'])
              // const artistsList = artwork['authors_list'].replace(/ *\([^)]*\) */g, "")
              const artistsList = artwork['authors_list']
              if (artistsList.indexOf(',') > -1) com++
              if (artistsList.indexOf('&') > -1) esp++
              // const artists = artistsList.split(',')
              const artists = [artistsList]
              artists
                .filter(artistName => artistName && artistName.indexOf("Anonyme") === -1)
                .forEach(artistName => {
                  if (!artistMap[artistName]) {
                    artistMap[artistName] = {
                      name: artistName,
                      acquisitionDates: [],
                      acquisitionDateProcessed: []
                    }
                  }
                  const artist = artistMap[artistName]
                  if (artist.acquisitionDates.indexOf(year) === -1) {
                    artist.acquisitionDates.push(year)
                  }
                })
            })

            // console.log(com, esp)

            Object.keys(artistMap)
              .map(name => artistMap[name])
              .forEach(artist => {
                artist.acquisitionDates.sort()
                
              })


            // console.log('ranking acquisition year span', Object.keys(artistMap)
            //   .map(name => artistMap[name])
            //   .sort((a1, a2) => a2.acquisitionDates.length - a1.acquisitionDates.length)
            // )

            // const timeframe = [
            //   artworks.reduce((min, artwork) => Math.min(parseInt(artwork['acquisition_year']), min), 10000),
            //   artworks.reduce((max, artwork) => Math.max(parseInt(artwork['acquisition_year']), max), -100),
            // ]

            const timeframe = [1945, 2015]

            const maxAcquisition = Object.keys(artistMap)
              .map(name => artistMap[name])
              .reduce((max, artist) => Math.max(max, artist.acquisitionDates.length), 0)


            const seniorityBuckets = new Array(timeframe[1] - timeframe[0] + 1).fill(0).map(() => new Array(maxAcquisition).fill(0))

            artworks
              .filter(artwork => parseInt(artwork['acquisition_year']) >= 1945 && parseInt(artwork['acquisition_year']) < 2016)
              .forEach(artwork => {
                const year = parseInt(artwork['acquisition_year'])
                // const artistsList = artwork['authors_list'].replace(/ *\([^)]*\) */g, "")
                const artistsList = artwork['authors_list']
                // const artists = artistsList.split(',')
                const artists = [artistsList]
                artists
                  .filter(artistName => artistName && artistName.indexOf("Anonyme") === -1)
                  .forEach(artistName => {
                    const artist = artistMap[artistName]
                    if (artist.acquisitionDateProcessed.indexOf(year) === -1) {
                      const artworksAlreadyAcquired = artist.acquisitionDates.indexOf(year)
                      seniorityBuckets[year - timeframe[0]][artworksAlreadyAcquired]++
                      artist.acquisitionDateProcessed.push(year)
                    }
                  })
              })

            const seniority = seniorityBuckets.map(seniorities => {
              const artworkTotal = seniorities.reduce((total, count) => total + count, 0)
              return seniorities.map(count => count / artworkTotal)
            })

            // console.log('aga', fnacData, seniority)
            // for (let i = 0; i < 70; i++) {
            //   console.log(fnacData[i][0], seniority[i][0])
            // }


            /////////////////////


            const galleryMap = artworkData
              .filter(artwork => 
                artwork.provenance_type === 'galerie' 
                && parseInt(artwork.acquisition_year) >= 1945
                && artwork.provenance
              )
              .reduce((map, artwork) => {
                if (!map[artwork.provenance]) map[artwork.provenance] = new Gallery(artwork.provenance)
                map[artwork.provenance].addAcquisition(artwork._id, parseInt(artwork.acquisition_year), artwork.acquisition_mode.toLowerCase(), artwork.authors_list, artwork.domain) 
                return map
              }, {})

            const galleries = Object.keys(galleryMap).map(id => galleryMap[id])

            //
            // const domains = {}
            // galleries.forEach(gallery => {
            //   const mainDomain = Object.keys(gallery.domainMap).reduce((mainDomain, id) => {
            //     const count = gallery.domainMap[id]
            //     if (count > mainDomain.count) {
            //       return {id, count}
            //     } else {
            //       return mainDomain
            //     }
            //   }, {id: null, count: 0})
              
            //   const ratio = Math.floor(mainDomain.count / gallery.acquisitionTotal * 10)

            //   if (!domains[mainDomain.id]) {
            //     domains[mainDomain.id] = new Array(11).fill(0)
            //   }
            //   domains[mainDomain.id][ratio]++
            // })
            // console.log('Distribution of galleries by the ratio of artworks belonging to their domain of predilection', domains)
            //

            const generalPath = `${process.env.PUBLIC_URL}/data/rays_noPCA.csv`
            csv(generalPath, (error, generalData) => {
              if (error) {
                return console.log('error loading data:', error)
              }

              const artists = generalData
                .filter(artist => artist.artist && artist.artist.length < 100)
                .map(artist => {
                  return {
                    name: artist['artist'],
                    x: parseFloat(artist['x_value'].slice(1,-1)),
                    sequence: chunk(artist['sequence'].slice(1,-1).split(', ').map(v => parseInt(v)), 4)
                  }
                })
                .sort((a1, a2) => a1.x - a2.x)
                // .slice(0, 1000)
                .map((artist, i) => new Artist(artist.name, i, artist.sequence, Math.floor(Math.random() * 40) + 1945))

              const timePath = `${process.env.PUBLIC_URL}/data/rays_year.csv`
              csv(timePath, (error, timeData) => {
                if (error) {
                  return console.log('error loading data:', error)
                }

                const artistsByYear = timeData
                  .filter(artist => artist.name && artist.name.length < 100)
                  .map(artist => {
                    const a = {
                      name: artist['name'],
                      x: parseFloat(artist['x_value']),
                      sequence: chunk(artist['vector'].slice(1,-1).split(' ').map(v => parseInt(v)), 4),
                      firstAcquisition: parseInt(artist['year'])
                    }
                    return a 
                  })
                  .sort((a1, a2) => a1.x - a2.x)
                  .map((artist, i) => new Artist(artist.name, i, artist.sequence, artist.firstAcquisition))

                this.setState({
                  ...this.state,
                  artists,
                  artistsByYear,
                  galleries,
                  seniority,
                  fnacData,
                  mnamData,
                  momaData
                })
              })
            })
          })
        })
      })
    })
  }

  toggleLayout () {
    this.setState({
      ...this.state,
      fullLayout: !this.state.fullLayout
    })
  }

  setCurrentPage (currentPage) {
    this.setState({
      ...this.state,
      currentPage
    })
  }

  render() {
    const {
      artists,
      fullLayout,
      currentPage,
      seniority
    } = this.state

    if (!artists) return null

    return (
      <Router>
        <div className="app">
          <div className="header">
            <ul className="navigation">
              <li
                className={ currentPage === '/' ? 'active' : '' }
              >
                <Link
                  to="/"
                  onClick={() => {
                    this.setCurrentPage('/')
                  }}
                >General</Link>
              </li>
              <li
                className={ currentPage === '/type' ? 'active' : '' }
              >
                <Link
                  to="/type"
                  onClick={() => {
                    this.setCurrentPage('/type')
                  }}
                >Type</Link>
              </li>
              <li
                className={ currentPage === '/time' ? 'active' : '' }
              >
                <Link
                  to="/time"
                  onClick={() => {
                    this.setCurrentPage('/time')
                  }}
                >Time</Link>
              </li>
              <li
                className={ currentPage === '/provenance' ? 'active' : '' }
              >
                <Link
                  to="/provenance"
                  onClick={() => {
                    this.setCurrentPage('/provenance')
                  }}
                >Provenance</Link>
              </li>
              <li
                className={ currentPage === '/collection' ? 'active' : '' }
              >
                <Link
                  to="/collection"
                  onClick={() => {
                    this.setCurrentPage('/collection')
                  }}
                >Collection</Link>
              </li>
            </ul>
            <div
              className="layout"
              onClick={this.toggleLayout}
            >
              <span
                className={ fullLayout ? 'active' : '' }
              >
                Full
              </span>
              /
              <span
                className={ fullLayout ? '' : 'active' }
              >
                Minimal
              </span>
            </div>
          </div>

          <hr/>

          <Route 
            exact
            path="/"
            render={(props) => (<GeneralPage {...this.state}/>)}
          />
          <Route 
            exact
            path="/type"
            render={(props) => (<TypePage {...this.state}/>)}
          />
          <Route 
            exact
            path="/time"
            render={(props) => (<TimePage {...this.state}/>)}
          />
          <Route 
            exact
            path="/provenance"
            render={(props) => (<ProvenancePage {...this.state}/>)}
          />
          <Route 
            exact
            path="/collection"
            render={(props) => (<CollectionPage {...this.state}/>)}
          />
        </div>
      </Router>
    )
  }
}

class Gallery {
  constructor (id) {
    this.name = id
    this.addAcquisition = this.addAcquisition.bind(this)
    this.timeframe = [1945, 2016]
    this.sequence = new Array(this.timeframe[1] - this.timeframe[0]).fill(0).map(v => [0, 0, 0, 1])
    this.artists = new Array(this.timeframe[1] - this.timeframe[0]).fill(0).map(v => [[], [], []])
    this.artistMap = {}
    this.firstAcquisition = 2016
    this.lastAcquisition = 1945
    this.acquisitionTotal = 0
    this.domainMap = {}
  
    this.addAcquisition = this.addAcquisition.bind(this)
  }

  addAcquisition (id, year, mode, artistNames, domain) {
    this.acquisitionTotal++

    if (year < this.firstAcquisition) {
      this.firstAcquisition = year
    }

    if (year > this.lastAcquisition) {
      this.lastAcquisition = year
    }

    const yearSinceStart = year - this.timeframe[0]

    const modeIndex = mode === 'achat' ? 0 : 
      mode === 'commande' ? 1 :
      mode === 'don' ? 2 : 2
    this.sequence[yearSinceStart][modeIndex]++
    this.sequence[yearSinceStart][3] = 0
    this.artists[yearSinceStart][modeIndex].push(artistNames)
    
    if (!this.artistMap[artistNames]) {
      this.artistMap[artistNames] = new Array(2017 - 1945).fill(null)
    }

    if (!this.artistMap[artistNames][yearSinceStart]) {
      this.artistMap[artistNames][yearSinceStart] = [0, 0, 0, 0]
    }

    this.artistMap[artistNames][yearSinceStart][modeIndex]++

    if (!this.domainMap[domain]) {
      this.domainMap[domain] = 0
    }
    this.domainMap[domain]++
  }
}

