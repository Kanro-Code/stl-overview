const path = require('path');
const ThreeD = require('./threed');

class Obj extends ThreeD {
	constructor(file) {
		super(file);
	}

	static isObj(file) {
		return false;
	}
}

module.exports = Obj