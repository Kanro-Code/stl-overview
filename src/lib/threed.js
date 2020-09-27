const path = require('path');
const fs = require('fs');


class ThreeD {
	constructor(location) {
		this.location = location;
	}

	generateImage(output, scad, settings) {
		return new Promise((resolve, reject) => {
			if (settings.h === undefined) 
				settings.h = 800
			if (settings.w === undefined) 
				settings.w = 800

			scad.generateImage(output, this, settings)
				.then((image) => {
					this.image = image
					resolve(this.image)
				})
		})
	}

	static getChildInstance = function(file) {
		let Stl = require('./threed-stl.js');
		if (Stl.isStl(file)) 
			return new Stl(file)

		let Obj = require('./threed-obj.js');
		if (Obj.isObj(file)) 
			return new Obj(file)
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

	static sortObjs(objs, sortedBy) {
		if (sortedBy === 'size') {
			objs.sort((a,b) => { return b.size - a.size })
		} else if(sortedBy === 'random') {
			// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
			for (let i = objs.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				[objs[i], objs[j]] = [objs[j], objs[i]]
			}
		}

		return objs
	}

	static getObjs = function (dir, recur = true, sortedBy) {
		let stats = fs.statSync(dir)
		let objs = []
		if (stats.isDirectory()) {
			objs = this.getObjsFolder(dir, recur)
		} else if (stats.isFile()) {
			const obj = this.getChildInstance(dir)
			if (obj)
				objs.push(obj)
		}

		this.sortObjs(objs, sortedBy)

		objs = objs.map(e => 
			Object.assign(e, { relative: dir })
		)

		return objs
	}

	set location (location) {
		this._location = location;
		this._size = null;
	}

	get location () {
		return this._location;
	}

	get size () {
		if (!this._size) {
			this._size = fs.statSync(this.location).size;
		}
		return this._size;
	}
}

module.exports = ThreeD;