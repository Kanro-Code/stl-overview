const path = require('path');
const fs = require('fs');

class ThreeD {
	constructor(location) {
		this.location = location;
	}

	async generateImage(output, scad, settings) {
		if (!settings.h)
			settings.h = 800;
		if (!settings.w)
			settings.w = 800;

		output = await scad.generateImage(output, this, settings);
		return output;
	}

	static getChildInstance = function(file) {
		let Stl = require('./threed-stl.js');
		if (Stl.isStl(file)) return new Stl(file);

		let Obj = require('./threed-obj.js');
		if (Obj.isObj(file)) return new Obj(file);
	}

	static getObjsFolder = function (dir, recur = true, objs) {
		objs = objs || [];
		const files = fs.readdirSync(dir, { withFileTypes: true });

		files.forEach(file => {
			var currentFile = path.join(dir, file.name);

			if (recur && file.isDirectory()) {
				objs = this.getObjsFolder(currentFile, recur, objs);
			} else if (file.isFile()) {
				let obj = this.getChildInstance(currentFile);
				if (obj) objs.push(obj);
			}
		});
		return objs
	}

	static getObjs = function (dir, recur = true, sortedBy) {
		if (path.parse(dir).ext) {
			let obj = this.getChildInstance(dir);
			return (obj) ? [obj] : false;
		} else {
			let objs = this.getObjsFolder(dir, recur);

			if (sortedBy === 'size') {
				objs.sort((a,b) => {
					return b.size - a.size;
				});
			} else if(sortedBy === 'random') {
				// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
				for (let i = objs.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[objs[i], objs[j]] = [objs[j], objs[i]];
				}
			}

			return objs
		}
	}

	set location(location) {
		this._location = location;
		this._size = null;
	}

	get location() {
		return this._location;
	}

	get size() {
		if (!this._size) {
			this._size = fs.statSync(this.location).size;
		}
		return this._size;
	}
}

module.exports = ThreeD;