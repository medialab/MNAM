


import React, { Component } from 'react'
import { csv } from 'd3-request'
import { hcl, rgb } from 'd3-color'

import DistributionGraph from './DistributionGraphWait'

export default class WaitPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      fnacData: null,
      mnamData: null,
      momaData: null,
      fnacArtists: null
    }

    // this.initArtistPaths = this.initArtistPaths.bind(this)
    this.loadArtworks = this.loadArtworks.bind(this)
  }

  componentDidMount () {
    const fnacArtworksPath = `${process.env.PUBLIC_URL}/data/uniq_artworks.csv`
    const mnamArtworksPath = `${process.env.PUBLIC_URL}/data/unique_artworks_mnam.csv`
    const momaArtworksPath = `${process.env.PUBLIC_URL}/data/artworks_moma.csv`

    csv(fnacArtworksPath, (error, fnacArtworks) => {
      const filteredFNACArtworks = fnacArtworks
        .filter(artwork => parseInt(artwork['acquisition_year']) > 1700 && parseInt(artwork['acquisition_year']) <= 2015)
        .filter(artwork => artwork['acquisition_mode'].toLowerCase().indexOf('achat') > -1)

      this.loadArtworks(filteredFNACArtworks, 'fnac', () => {
        console.log('done1')

        csv(mnamArtworksPath, (error, mnamArtworks) => {
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

          this.loadArtworks(filteredMNAMArtworks, 'mnam', () => {
            console.log('done2')

            csv(momaArtworksPath, (error, momaArtworks) => {
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

              this.loadArtworks(filteredMOMAArtworks, 'moma', () => {
                console.log('done3')
              })
            })
          })
        })
      })
    })
  }

  loadArtworks (artworks, id, callback) {
    const allArtists = {}

    artworks.forEach(artwork => {
      const year = parseInt(artwork['acquisition_year'])
      const artistsList = artwork['authors_list'].replace(/ *\([^)]*\) */g, "")
      const artists = artistsList.split(',')

      artists
        .filter(artistName => artistName 
          && artistName.indexOf("Anonyme") === -1
          && artistName.indexOf("Various Artists") === -1
        )
        .forEach(artistName => {
          if (!allArtists[artistName]) {
            const color = rgb(hcl(Math.floor(Math.random() * 360), 75, 50))
            allArtists[artistName] = {
              name: artistName,
              acquisitionDates: [],
              color: [color.r / 255, color.g / 255, color.b / 255]
            }
          }
          const artist = allArtists[artistName]
          if (artist.acquisitionDates.indexOf(year) === -1) {
            artist.acquisitionDates.push(year)
          }
        })
    })

    const filteredArtists = {}
    Object.keys(allArtists).map(id => {
      const artist = allArtists[id]
      artist.acquisitionDates.sort()
      const acquisitionsDuringTimeframe = artist.acquisitionDates.filter(year => year >= 1945)
      if (acquisitionsDuringTimeframe.length > 0) {
        filteredArtists[id] = artist
      }
    })

    const distribution = new Array(2015 - 1945 + 1).fill(0).map(v => [])

    for (let year = 1945; year <= 2015; year++) {
      const delayPerPreviousAcquisitions = new Array(10).fill(0)
      const acquisitionCountPerPreviousAcquisitions = new Array(10).fill(0)
      Object.keys(filteredArtists)
        .map(name => filteredArtists[name])
        .forEach(artist => {
          const acquisitionCount = artist.acquisitionDates.indexOf(year)
          if (acquisitionCount > 0 && acquisitionCount <= 10) {
            delayPerPreviousAcquisitions[acquisitionCount - 1] += 
              artist.acquisitionDates[acquisitionCount] - artist.acquisitionDates[acquisitionCount - 1]
            acquisitionCountPerPreviousAcquisitions[acquisitionCount - 1]++
          }
        })

      delayPerPreviousAcquisitions.forEach((delay, i) => {
        if (acquisitionCountPerPreviousAcquisitions[i] === 0) {
          distribution[year - 1945][i] = 0
        } else {
          distribution[year - 1945][i] = delay / acquisitionCountPerPreviousAcquisitions[i]
        }
      })
    }

    this.setState({
      ...this.state,
      [`${id}Distribution`]: distribution
    }, () => {
      callback()
    })
  }

  render () {
    const {
      fnacDistribution,
      mnamDistribution,
      momaDistribution
    } = this.state

    return (
      <div
        className="page"
      >
        {
          fnacDistribution &&
          <DistributionGraph
            data={ fnacDistribution }
          />
        }
        {
          mnamDistribution &&
          <DistributionGraph
            data={ mnamDistribution }
          />
        }
        {
          momaDistribution &&
          <DistributionGraph
            data={ momaDistribution }
          />
        }
      </div>
    )
  }
}