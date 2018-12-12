
import React, { Component } from 'react'
import { csv } from 'd3-request'
import { hcl, rgb } from 'd3-color'

import DistributionGraph from './DistributionGraph'

export default class CollectionPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      fnacData: null,
      mnamData: null,
      momaData: null,
      fnacArtists: null
    }

    this.parseData = this.parseData.bind(this)
    this.initArtistPaths = this.initArtistPaths.bind(this)
    this.loadArtworks = this.loadArtworks.bind(this)
  }

  componentDidMount () {
    const fnacDistributionPath = `${process.env.PUBLIC_URL}/data/fnac_acquisition_distri.csv`
    const mnamDistributionPath = `${process.env.PUBLIC_URL}/data/mnam_acquisition_distri.csv`
    const momaDistributionPath = `${process.env.PUBLIC_URL}/data/moma_acquisition_distri.csv`

    csv(fnacDistributionPath, (error, fnacDistributionData) => {
      csv(mnamDistributionPath, (error, mnamDistributionData) => {
        csv(momaDistributionPath, (error, momaDistributionData) => {
          const fnacData = this.parseData(fnacDistributionData)
          const mnamData = this.parseData(mnamDistributionData).slice(0, -1)
          const momaData = this.parseData(momaDistributionData).slice(0, -2)

          this.setState({
            ...this.state,
            fnacData,
            mnamData,
            momaData
          }, this.initArtistPaths)
        })
      })
    })
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

    const maxSeniority = dataRaw.reduce((max, year) => Math.max(max, year.distribution.length), 0)
    dataRaw.forEach(year => {
      for (let i = 0; i < maxSeniority; i++) {
        if (!year.distribution[i]) year.distribution[i] = 0
      }
    })
    const data = dataRaw.map(year => year.distribution)
    // console.log(data.join('\n'))
    return data
  }

  initArtistPaths () {
    const fnacArtworksPath = `${process.env.PUBLIC_URL}/data/uniq_artworks.csv`
    const mnamArtworksPath = `${process.env.PUBLIC_URL}/data/unique_artworks_mnam.csv`
    const momaArtworksPath = `${process.env.PUBLIC_URL}/data/artworks_moma.csv`

    csv(fnacArtworksPath, (error, fnacArtworks) => {
      const filteredFNACArtworks = fnacArtworks
        .filter(artwork => parseInt(artwork['acquisition_year']) > 1700 && parseInt(artwork['acquisition_year']) <= 2015)
        .filter(artwork => artwork['acquisition_mode'].toLowerCase().indexOf('achat') > -1)

      this.loadArtworks(filteredFNACArtworks, 'fnac', () => {
        console.log('done FNAC')
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
            console.log('done MNAM')

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
                console.log('done MOMA')
              })
            })
          })
        })
      })
    })
  }

  loadArtworks (artworks, id, callback) {
    const allArtists = {}
    // const pattern = /,\s[0-9]{4}/g

    artworks.forEach(artwork => {
      const year = parseInt(artwork['acquisition_year'])
      const artistsList = artwork['authors_list'].replace(/ *\([^)]*\) */g, "")
      const artists = artistsList.split(',')

      if (year >= 1945) {
        artists
          .filter(artistName => artistName &&
            artistName.indexOf('Anonyme') === -1 &&
            artistName.indexOf('Various Artists') === -1
          )
          .forEach(artistName => {
            if (!allArtists[artistName]) {
              const color = rgb(hcl(Math.floor(Math.random() * 360), 75, 50))
              // const dates = (artwork['authors_birth_death'].match(pattern) || []).map(d => parseInt(d))
              // if (dates.length === 0) console.log(artistsList, artwork['authors_birth_death'])
              // if (dates.length > 2) console.log(artwork['authors_birth_death'])
              allArtists[artistName] = {
                name: artistName,
                acquisitionDates: [],
                color: [color.r / 255, color.g / 255, color.b / 255]
                // dates
              }
            }
            const artist = allArtists[artistName]
            if (artist.acquisitionDates.indexOf(year) === -1) {
              artist.acquisitionDates.push(year)
            }
          })
      }
    })

    // console.log(
    //   'aga',
    //   Object.keys(allArtists).length,
    //   Object.keys(allArtists).map(name => allArtists[name]).filter(artist => artist.dates.length > 0).length
    // )

    const filteredArtists = {}
    Object.keys(allArtists).map(id => {
      const artist = allArtists[id]
      artist.acquisitionDates.sort()
      const acquisitionsDuringTimeframe = artist.acquisitionDates.filter(year => year >= 1945)
      if (acquisitionsDuringTimeframe.length > 1) {
        filteredArtists[id] = artist
      }
    })

    this.setState({
      ...this.state,
      [`${id}Artists`]: filteredArtists
    }, callback)
  }

  render () {
    const {
      fnacData,
      mnamData,
      momaData,
      fnacArtists,
      mnamArtists,
      momaArtists
    } = this.state

    if (!fnacData || !mnamData || !momaData) return null

    return (
      <div
        className='page'
      >
        <DistributionGraph
          data={[fnacData]}
          artists={fnacArtists}
        />
        <DistributionGraph
          data={[mnamData]}
          artists={mnamArtists}
        />
        <DistributionGraph
          data={[momaData]}
          artists={momaArtists}
        />
      </div>
    )
  }
}