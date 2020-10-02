const path = require('path')
const ThreeD = require('./threed')

class Obj extends ThreeD {
	constructor (file) {
		super(file)
	}

	static isObj (file) {
		// var ext = path.parse(file).ext.toLowerCase();
		// return (ext == '.obj') ? true : false;
		return false
	}
}

module.exports = Obj
