const path = require('path')
const ThreeD = require('./threed')

class Stl extends ThreeD {
  constructor (file) {
    super(file)
  }

  static isStl (file) {
    var ext = path.parse(file).ext.toLowerCase()
    return (ext === '.stl')
  }
}

module.exports = Stl
