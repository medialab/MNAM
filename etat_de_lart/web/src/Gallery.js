
export default class Gallery {
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