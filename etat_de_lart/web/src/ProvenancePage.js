

import React, { Component } from 'react'
import { indexOfMax } from './utils'

export default class ProvenancePage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      highlightedGallery: null,
      highlightedYear: -1
    }
    this.setHighlight = this.setHighlight.bind(this)
  }

  setHighlight (gallery, year) {
    if (!gallery) {
      this.setState({
        ...this.state,
        highlightedGallery: null,
        highlightedYear: -1
      })
    } else {
      this.setState({
        ...this.state,
        highlightedGallery: gallery,
        highlightedYear: year
      })
    }
  }

  render () {
    const {
      galleries,
      fullLayout
    } = this.props

    const {
      highlightedGallery,
      highlightedYear
    } = this.state

    if (!galleries) return null

    const timeframe = [1945, 2016]
    const width = window.innerWidth - 100 - 200
    const widthPerYear = width / (timeframe[1] - timeframe[0])

    const labels = new Array(Math.floor((timeframe[1] - timeframe[0]) / 10))
      .fill(0)
      .map((a, i) => {
        return (
          <li
            key={ `label-${i}` }
            style={{
              width: widthPerYear * 10
            }}
          >
            {1945 + i * 10}
          </li>
        )
      })

    const galleriesByDomain = {
      'Miscellaneous': []
    }
    galleries.forEach(gallery => {
      const mainDomain = Object.keys(gallery.domainMap).reduce((mainDomain, id) => {
        const count = gallery.domainMap[id]
        if (count > mainDomain.count) {
          return {id, count}
        } else {
          return mainDomain
        }
      }, {id: null, count: 0})
      if (mainDomain.count > gallery.acquisitionTotal * 0.8) {
        if (!galleriesByDomain[mainDomain.id]) {
          galleriesByDomain[mainDomain.id] = []
        }
        galleriesByDomain[mainDomain.id].push(gallery)
      } else {
        galleriesByDomain['Miscellaneous'].push(gallery)
      }
    })

    const domains = Object.keys(galleriesByDomain)
      .sort((d1, d2) => galleriesByDomain[d2].length - galleriesByDomain[d1].length)
    domains.push(domains.shift())

    const domainList = domains.map((domain, l) => {
        const galleryList = galleriesByDomain[domain].sort((g1, g2) => g1.firstAcquisition - g2.firstAcquisition)
          .map((gallery, i) => {
            
            const artists = Object.keys(gallery.artistMap)
              .sort((a1, a2) => {
                let artist1FirstAcquisition = 1000
                let artist2FirstAcquisition = 1000
                const artist1 = gallery.artistMap[a1]
                const artist2 = gallery.artistMap[a1]

                gallery.artistMap[a1].some((record, year) => {
                  if (record) artist1FirstAcquisition = year
                  return record
                })

                gallery.artistMap[a2].some((record, year) => {
                  if (record) artist2FirstAcquisition = year
                  return record
                })

                if (artist1FirstAcquisition !== artist2FirstAcquisition) {
                  return artist1FirstAcquisition - artist2FirstAcquisition
                }

                return gallery.artistMap[a2].filter(r => r).reduce((total, mode) => total + mode[0] + mode[2], 0)
                     - gallery.artistMap[a1].filter(r => r).reduce((total, mode) => total + mode[0] + mode[2], 0)  
              })
              .map((name, j) => {
                const artistRecord = gallery.artistMap[name]
                const w = (gallery.lastAcquisition - gallery.firstAcquisition + 1) * widthPerYear
                const marginLeft = width - (2016 - gallery.firstAcquisition) * widthPerYear

                let lastK = -1
                let x = 0
                const sequence = artistRecord.map((seq, k) => {
                  if (!seq) {
                    return null
                  }

                  const marginLeft = (k - gallery.firstAcquisition + 1945) * widthPerYear - x
                  x += marginLeft + widthPerYear

                  const brightness = gallery === highlightedGallery && k === highlightedYear ? 140 : 255 
                  const acquisitionTotal = seq.reduce((total, mode) => total + mode, 0)
                  
                  const modes = seq.map((mode, l) => {
                    if (mode === 0) {
                      return null
                    }

                    const color = [0, 0, 0, 1]
                    color[l] = 255

                    return (
                      <li
                        key={ `gallery-${i}-artist-${j}-year-${k}-mode-${l}` }
                        className="mode"
                        style={{
                          backgroundColor: `rgba(${color.join(',')})`,
                          height: mode * 3
                        }}
                      >
                      </li>
                    )
                  })

                  return (
                    <li
                      key={ `gallery-${i}-artist-${j}-year-${k}` }
                      className="year"
                      style={{
                        maxWidth: widthPerYear,
                        width: widthPerYear,
                        position: 'relative',
                        marginLeft
                      }}
                    >
                      <ul>
                        { modes }
                      </ul>
                    </li>
                  )
                })

                return (
                  <ul
                    key={ `gallery-${i}-artist-${j}` }
                    style={{
                      marginLeft,
                      width: w,
                      backgroundColor: '#e0e0e0',
                      // borderLeft: 'solid 1px #e0e0e0',
                      // borderBottomLeft: 'solid 1px #e0e0e0',
                      // borderRight: 'solid 1px #e0e0e0',
                      // borderBottomRight: 'solid 1px #e0e0e0',
                      marginBottom: 2,
                      position: 'relative',
                      pointerEvents: 'none',
                      display: 'flex',
                      opacity: !highlightedGallery || (gallery === highlightedGallery && artistRecord[highlightedYear]) ? 1 : 0.4
                    }}
                  >
                    { sequence }
                  </ul>
                )
              })

            return (
              <li
                className={`gallery full`}
                key={ `gallery-${i}` }
              >
                <div className="name">
                  { gallery.name }<br/>{ gallery.firstAcquisition } - { gallery.lastAcquisition }
                </div>
                <ul
                  className="artists"
                  onMouseMove={ (event) => {
                    var bounds = event.target.getBoundingClientRect()
                    var x = event.clientX - bounds.left
                    const year = Math.floor(x / widthPerYear)
                    this.setHighlight(gallery, year)
                  }}
                  onMouseOut={ () => {
                    this.setHighlight(null)
                  }}
                >
                  { artists }
                </ul>
              </li>
            )
          })

        return (
          <li
            className="group"
            key={ `group-${l}` }
          >
            <h3>
              { domain }
            </h3>
            <ul className="labels">
              { labels }
            </ul>
            <ul>
              { galleryList }
            </ul>
          </li>
        )
      })

    let highlightList = null
    if (highlightedGallery) {      
      const artistMap = {}
      const modes = ['Achat', 'Commande', 'Don']

      modes.forEach((modeName, i) => {
        const artists = highlightedGallery.artists[highlightedYear][i]
        artists.forEach(artist => {
          if (!artistMap[artist]) {
            artistMap[artist] = [0, 0, 0]
          }
          artistMap[artist][i]++
        })
      })

      highlightList = Object.keys(highlightedGallery.artistMap)
        .filter(artistName => artistMap[artistName])
        .sort((a1, a2) => {
          let artist1FirstAcquisition = 1000
          let artist2FirstAcquisition = 1000
          const artist1 = highlightedGallery.artistMap[a1]
          const artist2 = highlightedGallery.artistMap[a1]

          highlightedGallery.artistMap[a1].some((record, year) => {
            if (record) artist1FirstAcquisition = year
            return record
          })

          highlightedGallery.artistMap[a2].some((record, year) => {
            if (record) artist2FirstAcquisition = year
            return record
          })

          if (artist1FirstAcquisition !== artist2FirstAcquisition) {
            return artist1FirstAcquisition - artist2FirstAcquisition
          }

          return highlightedGallery.artistMap[a2].filter(r => r).reduce((total, mode) => total + mode[0] + mode[2], 0)
               - highlightedGallery.artistMap[a1].filter(r => r).reduce((total, mode) => total + mode[0] + mode[2], 0)  
        })
        .map((name, j) => {
          const counts = artistMap[name].map((count, k) => {
            if (count === 0) {
              return null
            }

            const color = [0, 0, 0, 1]
            color[k] = 255

            return (
              <span
                key={ `highlight-artist-${j}-${k}` }
                style={{
                  color: `rgba(${color.join(',')})`,
                  marginLeft: 3,
                  marginRight: 3
                }}
              >
                { count }
              </span>
            )
          })
          return (
            <li
              key={ `highlight-artist-${j}` }
            >
              ({ counts }) { name }
            </li>
          )
        })
    }


    return (
      <div className="page">
        {
          highlightedGallery && highlightedYear + 1945 >= highlightedGallery.firstAcquisition && highlightedYear + 1945 <= highlightedGallery.lastAcquisition + 1945 && 
          <div className="highlight">
            <h3>
              { highlightedGallery.name }
            </h3>
            <h4>
              { highlightedYear + 1945 }
            </h4>
            <ul>
              { highlightList }
            </ul>
          </div>
        }
        <div className="title">
          <h2>Gallery Acquisition Sequences</h2>
          <h4>general ranking</h4>
        </div>
        <ul
          style={{
            marginLeft: fullLayout ? 0 : 200
          }}
        >
          { domainList }
        </ul>
      </div>
    )
  }
}