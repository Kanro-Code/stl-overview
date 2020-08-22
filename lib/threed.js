const path = require('path');
const fs = require('fs');

class ThreeD {
	constructor(loc, settings) {
		if (path.isAbsolute(loc)) {
			this.absolute = path.normalize(loc);
		} 
		else {
			this.absolute = path.resolve(process.cwd(), loc);
		}

		this.parse = path.parse(loc);
	}

	get size() {
		if (!this._size) {
			this._size = fs.statSync(this.absolute).size;
		}

		return this._size;
	}

	generateImage(openscad) {
		return new Promise((resolve, reject) => {
			openscad.generateImage(this.absolute)
				.then(image => {
					this.image = image;
					resolve(image);
				})
				.catch(err => reject(err));
		})
	}

	deleteImage() {
		fs.unlinkSync(this.image);
	}

	static getObjsFolder = function(dir, recur, list) {
		list = list || [];
		const files = fs.readdirSync(dir, { withFileTypes: true });

		files.forEach(file => {
			var currentFile = path.join(dir, file.name);
			if (recur && file.isDirectory()) {
				list = this.getObjsFolder(currentFile, recur, list);
			} else if (file.isFile()) {
				let instance = this.getChildInstance(currentFile);
				if (instance) {
					list.push(instance);
				}
			}
		});

		return list;
	}

	static getChildInstance = function(file) {
		let Stl = require('./stl.js');
		if (Stl.isStl(file)) {
			return new Stl(file);
		}

		let Obj = require('./obj.js');
		if (Obj.isObj(file)) {
			return new Obj(file);
		}
	}

	static sortBySize = function(list) {
		list.sort(function(a,b) {
			return b.size - a.size;
		}) 
		return list;
	}


}

module.exports = ThreeD;