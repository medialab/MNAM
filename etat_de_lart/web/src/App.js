/*

  normalisation temps
  boxplot
  mnam
  moma

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

import React, { Component } from 'react'
import { csv } from 'd3-request'

import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

import GeneralPage from './GeneralPage'
import DelayDensePage from './DelayDensePage'
import ProvenancePage from './ProvenancePage'
import CollectionPage from './CollectionPage'
import AgeDistributionPage from './AgeDistributionPage'
import ExhibitionPage from './ExhibitionPage'

import { chunk } from './utils'
import Gallery from './Gallery'
import Artist from './Artist'

import './App.css'

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
    this.initDenseDelay = this.initDenseDelay.bind(this)
  }

  componentDidMount () {
    const fnacArtworksPath = `${process.env.PUBLIC_URL}/data/uniq_artworks.csv`
    const mnamArtworksPath = `${process.env.PUBLIC_URL}/data/unique_artworks_mnam.csv`
    const momaArtworksPath = `${process.env.PUBLIC_URL}/data/artworks_moma.csv`

    csv(mnamArtworksPath, (error, mnamArtworks) => {
      if (error) {
        throw error
      }

      csv(momaArtworksPath, (error, momaArtworks) => {
        if (error) {
          throw error
        }

        csv(fnacArtworksPath, (error, fnacArtworks) => {
          if (error) {
            throw error
          }

          const filteredFNACArtworks = fnacArtworks
            .filter(artwork => parseInt(artwork['acquisition_year']) > 1700 && parseInt(artwork['acquisition_year']) <= 2015)
            .filter(artwork => artwork['acquisition_mode'].toLowerCase().indexOf('achat') > -1)

          const filteredMNAMArtworks = mnamArtworks
            .filter(artwork => parseInt(artwork['Year acquisition']) <= 2015)
            .map(artwork => {
              const year = parseInt(artwork['Year acquisition'])
              const authors = artwork['Id artists'].split('|').join(',')
              return {
                'acquisition_year': year,
                'authors_list': authors
              }
            })
            .filter(artwork => !!artwork['acquisition_year'])

          const filteredMOMAArtworks = momaArtworks
            .filter(artwork => parseInt(artwork['DateAcquired'].split('-')[0]) <= 2015)
            .map(artwork => {
              const year = parseInt(artwork['DateAcquired'].split('-')[0])
              const authors = artwork['Artist']
              return {
                'acquisition_year': year,
                'authors_list': authors
              }
            })
            .filter(artwork => !!artwork['acquisition_year'])

          const fnacArtistsMap = {}

          filteredFNACArtworks.forEach(artwork => {
            const year = parseInt(artwork['acquisition_year'])
            const artistsList = artwork['authors_list'].replace(/ *\([^)]*\) */g, '')
            const artists = artistsList.split(',')
            artists
              .filter(artistName => artistName && artistName.indexOf('Anonyme') === -1)
              .forEach(artistName => {
                if (!fnacArtistsMap[artistName]) {
                  fnacArtistsMap[artistName] = {
                    name: artistName,
                    acquisitionDates: [],
                    acquisitionDateProcessed: []
                  }
                }
                const artist = fnacArtistsMap[artistName]
                if (artist.acquisitionDates.indexOf(year) === -1) {
                  artist.acquisitionDates.push(year)
                }
              })
          })

          const fnacArtistsByFirstAcquisition = []
          Object.keys(fnacArtistsMap)
            .map(name => fnacArtistsMap[name])
            .forEach(artist => {
              artist.acquisitionDates.sort()
              const firstAcquisition = artist.acquisitionDates[0]
              if (firstAcquisition >= 1945) {
                if (!fnacArtistsByFirstAcquisition[firstAcquisition - 1945]) {
                  fnacArtistsByFirstAcquisition[firstAcquisition - 1945] = []
                }
                fnacArtistsByFirstAcquisition[firstAcquisition - 1945].push(artist)
              }
            })

          const delaysByAcquisition = fnacArtistsByFirstAcquisition.map((year, i) => {
            return year.reduce((distribution, artist) => {
              artist.acquisitionDates.slice(1)
                .forEach((y, j) => {
                  distribution[j][y - (1945 + i + 1)]++
                })

              for (let j = 0; j < artist.acquisitionDates.length; j++) {
                const acquisitionYear = artist.acquisitionDates[j]
                const lastAcquisitionYear = artist.acquisitionDates[j - 1]
                distribution[j][acquisitionYear - lastAcquisitionYear - 1]++
              }

              return distribution
            }, new Array(50).fill(0).map(v => new Array(100).fill(0)))
          })

          delaysByAcquisition.forEach((year, i) => {
            delaysByAcquisition[i] = year.slice(0, 10).map(acquisition =>
              acquisition.slice(0, 10)
            )
          })

          // DENSE DELAY

          const denseDelay = this.initDenseDelay(filteredFNACArtworks)
          const denseDelayMNAM = this.initDenseDelay(filteredMNAMArtworks)
          const denseDelayMOMA = this.initDenseDelay(filteredMOMAArtworks)

          const galleryMap = filteredFNACArtworks
            .filter(artwork =>
              artwork.provenance_type === 'galerie' &&
              parseInt(artwork.acquisition_year) >= 1945 &&
              artwork.provenance
            )
            .reduce((map, artwork) => {
              if (!map[artwork.provenance]) map[artwork.provenance] = new Gallery(artwork.provenance)
              map[artwork.provenance].addAcquisition(artwork._id, parseInt(artwork.acquisition_year), artwork.acquisition_mode.toLowerCase(), artwork.authors_list, artwork.domain)
              return map
            }, {})

          const galleries = Object.keys(galleryMap).map(id => galleryMap[id])

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
                  x: parseFloat(artist['x_value'].slice(1, -1)),
                  sequence: chunk(artist['sequence'].slice(1, -1).split(', ').map(v => parseInt(v)), 4)
                }
              })
              .sort((a1, a2) => a1.x - a2.x)
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
                    sequence: chunk(artist['vector'].slice(1, -1).split(' ').map(v => parseInt(v)), 4),
                    firstAcquisition: parseInt(artist['year'])
                  }
                  return a
                })
                .sort((a1, a2) => a1.x - a2.x)
                .map((artist, i) => new Artist(artist.name, i, artist.sequence, artist.firstAcquisition))

              window.requestAnimationFrame(() => {
                this.setState({
                  ...this.state,
                  artists,
                  artistsByYear,
                  galleries,
                  delaysByAcquisition,
                  denseDelay,
                  denseDelayMNAM,
                  denseDelayMOMA
                })
              })
            })
          })
        })
      })
    })
  }

  initDenseDelay (artworks) {
    const artistMap = {}
    const timeframe = [1945, 2015]
    const artistsByYear = new Array(timeframe[1] - timeframe[0]).fill(0).map(v => [])

    artworks
      .filter(artwork => parseInt(artwork['acquisition_year']) < 2015)
      .forEach(artwork => {
        const year = parseInt(artwork['acquisition_year'])
        const artistsList = artwork['authors_list'].replace(/ *\([^)]*\) */g, '')
        const artists = artistsList.split(',')
        artists
          .filter(artistName => artistName && artistName.indexOf('Anonyme') === -1)
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

    Object.keys(artistMap)
      .map(name => artistMap[name])
      .forEach(artist => {
        artist.acquisitionDates
          .sort()
          .forEach((year, i) => {
            if (i > 0 && year >= 1945) {
              if (artistsByYear[year - 1945].indexOf(artist) === -1) {
                artistsByYear[year - 1945].push(artist)
              }
            }
          })
      })

    const delaysByYear = new Array(timeframe[1] - timeframe[0])
      .fill(0)
      .map((v, i) => {
        const year = i + timeframe[0]
        const delays = artistsByYear[i]
          .map(artist => {
            const lastAcquisitionYear = artist.acquisitionDates[artist.acquisitionDates.indexOf(year) - 1]
            return year - lastAcquisitionYear
          })
          .sort((d1, d2) => d1 - d2)

        // const delaysAverage = delays.reduce((total, delay) => total + delay, 0) / delays.length

        const mean = delays.length / 2 === Math.floor(delays.length / 2)
          ? (delays[Math.floor(delays.length / 2)] + delays[Math.ceil(delays.length / 2)]) / 2
          : delays[Math.floor(delays.length / 2)]

        const secondQuartile = delays.length / 4 === Math.floor(delays.length / 4)
          ? (delays[Math.floor(delays.length / 4)] + delays[Math.ceil(delays.length / 4)]) / 2
          : delays[Math.floor(delays.length / 4)]

        const thirdQuartile = delays.length / 4 * 3 === Math.floor(delays.length / 4 * 3)
          ? (delays[Math.floor(delays.length / 4 * 3)] + delays[Math.ceil(delays.length / 4 * 3)]) / 2
          : delays[Math.floor(delays.length / 4 * 3)]

        const total = delays.length

        const min = Math.min(...delays)
        const max = Math.max(...delays)

        return {
          mean,
          secondQuartile,
          thirdQuartile,
          min,
          max,
          delays,
          total
        }
      })

    return delaysByYear
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

  render () {
    const {
      fullLayout,
      currentPage
    } = this.state

    return (
      <Router>
        <div className='app'>
          <div className='header'>
            <ul className='navigation'>
              <li
                className={currentPage === '/' ? 'active' : ''}
              >
                <Link
                  to='/'
                  onClick={() => {
                    this.setCurrentPage('/')
                  }}
                >
                  Artist Sequences
                </Link>
              </li>
              <li
                className={currentPage === '/provenance' ? 'active' : ''}
              >
                <Link
                  to='/provenance'
                  onClick={() => {
                    this.setCurrentPage('/provenance')
                  }}
                >
                  Provenance
                </Link>
              </li>
              <li
                className={currentPage === '/delayDense' ? 'active' : ''}
              >
                <Link
                  to='/delayDense'
                  onClick={() => {
                    this.setCurrentPage('/delayDense')
                  }}
                >
                  Average Delay
                </Link>
              </li>
              <li
                className={currentPage === '/collection' ? 'active' : ''}
              >
                <Link
                  to='/collection'
                  onClick={() => {
                    this.setCurrentPage('/collection')
                  }}
                >
                  Collection
                </Link>
              </li>
              <li
                className={currentPage === '/ageDistribution' ? 'active' : ''}
              >
                <Link
                  to='/ageDistribution'
                  onClick={() => {
                    this.setCurrentPage('/ageDistribution')
                  }}
                >
                  Age Distribution
                </Link>
              </li>
              <li
                className={currentPage === '/exhibitions' ? 'active' : ''}
              >
                <Link
                  to='/exhibitions'
                  onClick={() => {
                    this.setCurrentPage('/exhibitions')
                  }}
                >
                  Exhibitions
                </Link>
              </li>
            </ul>
            <div
              className='layout'
              onClick={this.toggleLayout}
            >
              <span
                className={fullLayout ? 'active' : ''}
              >
                Full
              </span>
              /
              <span
                className={fullLayout ? '' : 'active'}
              >
                Minimal
              </span>
            </div>
          </div>

          <hr />

          <Route
            exact
            path='/'
            render={(props) => (<GeneralPage {...this.state} />)}
          />

          <Route
            exact
            path='/provenance'
            render={(props) => (<ProvenancePage {...this.state} />)}
          />

          <Route
            exact
            path='/collection'
            render={(props) => (<CollectionPage {...this.state} />)}
          />

          <Route
            exact
            path='/delayDense'
            render={(props) => (<DelayDensePage {...this.state} />)}
          />

          <Route
            exact
            path='/ageDistribution'
            render={(props) => (<AgeDistributionPage {...this.state} />)}
          />

          <Route
            exact
            path='/exhibitions'
            render={(props) => (<ExhibitionPage {...this.state} />)}
          />    

        </div>
      </Router>
    )
  }
}

// initMorphology (artworkData) {

//   const artworks = artworkData
//     .filter(artwork => parseInt(artwork['acquisition_year']) > 1700)

//   const artistMap = {}
//   artworks.forEach(artwork => {
//     const year = parseInt(artwork['acquisition_year'])
//     const artistsList = artwork['authors_list'].replace(/ *\([^)]*\) */g, "")
//     const artists = artistsList.split(',')

//     artists
//       .filter(artistName => artistName
//         && artistName.indexOf("Anonyme") === -1
//         && artistName.indexOf("Various Artists") === -1
//       )
//       .forEach(artistName => {
//         if (!artistMap[artistName]) {
//           artistMap[artistName] = {
//             name: artistName,
//             acquisitionDates: [],
//             acquisitionDateProcessed: []
//           }
//         }
//         const artist = artistMap[artistName]
//         artist.acquisitionDates.push(year)
//       })
//   })

//   const timeframe = [1945, 2015]
//   const absoluteMorphology = new Array(timeframe[1] - timeframe[0]).fill(0).map(v => new Array(50).fill(0))

//   Object.keys(artistMap)
//     .map(name => artistMap[name])
//     .forEach(artist => {
//       artist.acquisitionDates.sort()
//       for (let i = 0; i < artist.acquisitionDates.length; i++) {
//         for (let j = Math.max(timeframe[0], artist.acquisitionDates[i]); j < Math.min(timeframe[1], artist.acquisitionDates[i + 1] || timeframe[1]); j++) {
//           if (i < 50) {
//             absoluteMorphology[j - timeframe[0]][i]++
//           }
//         }
//       }
//     })

//   const morphology = absoluteMorphology.map(year => {
//     const totalArtistCount = year.reduce((count, artistCount) => count += artistCount, 0)
//     return year.map(artistCount => artistCount / totalArtistCount)
//   })

//   // console.log(morphology.join('\n'))
//   return morphology
// }

// initAccumulation (artworks) {
//   // return null

//   const artistMap = {}
//   const timeframe = [1945, 2015]
//   const artistsByYear = new Array(timeframe[1] - timeframe[0]).fill(0).map(v => [])

//   artworks
//     .filter(artwork => parseInt(artwork['acquisition_year']) < 2015)
//     .forEach(artwork => {
//       const year = parseInt(artwork['acquisition_year'])
//       const artistsList = artwork['authors_list'].replace(/ *\([^)]*\) */g, "")
//       const artists = artistsList.split(',')
//       artists
//         .filter(artistName => artistName && artistName.indexOf("Anonyme") === -1)
//         .forEach(artistName => {
//           if (!artistMap[artistName]) {
//             artistMap[artistName] = {
//               name: artistName,
//               acquisitionDates: [],
//               acquisitionDateProcessed: []
//             }
//           }
//           const artist = artistMap[artistName]
//           if (artist.acquisitionDates.indexOf(year) === -1) {
//             artist.acquisitionDates.push(year)
//           }
//         })
//     })

//   Object.keys(artistMap)
//     .map(name => artistMap[name])
//     .forEach(artist => {
//       artist.acquisitionDates
//         .sort()
//         .forEach((year, i) => {
//           if (i > 0 && year >= 1945) {
//             if (artistsByYear[year - 1945].indexOf(artist) === -1) {
//               artistsByYear[year - 1945].push(artist)
//             }
//           }
//         })
//     })

//   const delaysByYear = new Array(timeframe[1] - timeframe[0])
//     .fill(0)
//     .map((v, i) => {
//       const year = i + timeframe[0]

//       const delayByAcquisitionCount = new Array(10).fill(0).map(v => [])

//       artistsByYear[i].forEach(artist => {
//         if (artist.acquisitionDates.indexOf(year) > 0) {
//           const lastAcquisitionYear = artist.acquisitionDates[artist.acquisitionDates.indexOf(year) - 1]
//           const index = artist.acquisitionDates.indexOf(year) - 1
//           if (index < 10) {
//             // if (!delayByAcquisitionCount[index]) {
//             //   delayByAcquisitionCount[index] = []
//             // }
//             delayByAcquisitionCount[index].push(year - lastAcquisitionYear)
//           }
//         }
//       })

//       const averagedDelays = delayByAcquisitionCount
//         .map(delays => delays.reduce((total, years) => total + years, 0) / (delays.length || 1))

//       return averagedDelays
//     })

//   return delaysByYear
// }
