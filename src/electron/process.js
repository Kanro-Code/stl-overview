const fs = require('fs');
const path = require('path');
const async = require('async');
const ThreeD = require('../lib/threed');
const Stl = require('../lib/stl');
const Openscad = require('../lib/openscad');
const Stitch = require('../lib/stitch');
const mkdirp = require('mkdirp');

class Process {
	constructor(conf, dirs, window) {
		// dirs = ["/Users/thijs/Downloads/All Pokemon",
		//  "/Users/thijs/Downloads/April", 
		//  "/Users/thijs/Downloads/DT+-+CRD+Objective+marker", 
		//  "/Users/thijs/Downloads/Marko - Sol Justicar", 
		//  "/Users/thijs/Downloads/Mechs", 
		//  "/Users/thijs/Downloads/Vulpeana Whitebranch", 
		//  "/Users/thijs/Downloads/Lazy+Grid+Clock", 
		//  "/Users/thijs/Downloads/Lazy+Grid+Clock (1)", 
		//  "/Users/thijs/Downloads/tools-modular-desktop-stand-tweezerplierscrewdriver-v-20-model_files", 
		//  "/Users/thijs/Downloads", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…_Wheel_Frames_Roof_Chimney_top_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ridge_walls_Rod-holder_Chimney_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…e_walls_Rod-holder_Chimney_v02_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ulti-part_-_Complete_17_shells_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ti-part_-_Single_-_Bridge_roof_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…i-part_-_Single_-_Bridge_walls_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ulti-part_-_Single_-_Cargo_box_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…i-part_-_Single_-_Chimney_body_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ti-part_-_Single_-_Chimney_top_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…i-part_-_Single_-_Deck_surface_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…part_-_Single_-_Doorframe_port_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…-_Single_-_Doorframe_starboard_-_3DBenchy.com.stl", 
		//  "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…_-_Single_-_Fishing-rod-holder_-_3DBenchy.com.stl"]
		console.log(dirs);
		dirs = [
			"D:\\Downloads\\torrents\\[3D Art Guy] Living Saint - May 2020",
			"D:\\Downloads\\torrents\\[3D Art Guy] Marilith Demon - April 2020",
			"D:\\Downloads\\torrents\\[3D Art Guy] Marilith normal - April 2020",
			"D:\\Downloads\\torrents\\[3D Art Guy] Succubus Demon - April 2020",
			"D:\\Downloads\\torrents\\[3D Forge] April 2019",
			"D:\\Downloads\\torrents\\- Blindrune Cult",
			"D:\\Downloads\\torrents\\ hobitonn Bonsay",
			"D:\\Downloads\\torrents\\(Kickstarter - Mia Kay) Familiars and Beasts",
			"D:\\Downloads\\torrents\\[3D Art Guy] Crusader Diorama",
			"D:\\Downloads\\torrents\\[3D Art Guy] Dead Knight",
			"D:\\Downloads\\torrents\\[3D Art Guy] GreatJaw Orc Fighter",
			"D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_Arm.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_FINAL.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_Hand.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_WHOLE.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragonlionne_FINAL.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragonlionne_Head.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragonlionne_NoBase_WHOLE.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragonlionne_Peg.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragonlionne_Tail.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragonlionne_Tail2.stl",
			"D:\\Desktop\\STL Temp TEst\\Dragonlionne_WHOLE.stl",
			"D:\\Desktop\\STL Temp TEst\\DragonTurtle"
		];
		this.dirs = dirs;
		this.window = window;
		this.conf = conf;

		let imgW = Math.floor(this.conf.outputW / this.conf.stitchColumns);
		this.conf.imgW = imgW ;
		this.conf.imgH = imgW;
		this.conf.outputW = imgW * this.conf.stitchColumns;
	}

	outputLocation(dir, createFolder = false) {
		let output;

		if (this.conf.scadOutputAbsolute) {
			output = this.conf.scadOutputName;
		} else {
			console.log(dir);
			if (fs.lstatSync(dir).isFile()) {
				dir = path.parse(dir).dir
			};
			console.log(dir);
			output = path.resolve(dir, this.scadOutputName);
		}

		if (createFolder) {
			mkdirp.sync(this.conf.scadOutputName)
		}

		return output;
	}

	outputName(stl) {
	}

	start() {
		// Prepare folders
		let parts = [];
		let length = 0;

		this.dirs.forEach(dir => {
			let part = ThreeD.getObjs(dir, this.conf.imgsRecur, this.conf.imgsSortedSize);
			length += part.length;
			if (part) {
				parts.push(part);
				
				let openscad = new Openscad(this.conf);
				openscad.scadOutputDir = this.outputLocation(dir, true);

				part.forEach(stl => {
					stl.openscad = openscad;
				})
			};
		});
		
		console.log(parts);

		// Assign openscad to all objects;

		console.log(this.conf);

	}

	
}
module.exports = Process;




