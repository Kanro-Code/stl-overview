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
    dirs = ["/Users/thijs/Downloads/All Pokemon",
     "/Users/thijs/Downloads/April", 
     "/Users/thijs/Downloads/DT+-+CRD+Objective+marker", 
     "/Users/thijs/Downloads/Marko - Sol Justicar", 
     "/Users/thijs/Downloads/Mechs", 
     "/Users/thijs/Downloads/Vulpeana Whitebranch", 
     "/Users/thijs/Downloads/Lazy+Grid+Clock", 
     "/Users/thijs/Downloads/Lazy+Grid+Clock (1)", 
     "/Users/thijs/Downloads/tools-modular-desktop-stand-tweezerplierscrewdriver-v-20-model_files", 
     "/Users/thijs/Downloads", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…_Wheel_Frames_Roof_Chimney_top_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ridge_walls_Rod-holder_Chimney_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…e_walls_Rod-holder_Chimney_v02_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ulti-part_-_Complete_17_shells_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ti-part_-_Single_-_Bridge_roof_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…i-part_-_Single_-_Bridge_walls_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ulti-part_-_Single_-_Cargo_box_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…i-part_-_Single_-_Chimney_body_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…ti-part_-_Single_-_Chimney_top_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…i-part_-_Single_-_Deck_surface_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…part_-_Single_-_Doorframe_port_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…-_Single_-_Doorframe_starboard_-_3DBenchy.com.stl", 
     "/Users/thijs/Downloads/#3DBenchy+-+The+jolly+3D+pr…_-_Single_-_Fishing-rod-holder_-_3DBenchy.com.stl"]

     this.conf = conf;
     this.dirs = dirs;
     this.window = window;

  }

  outputLocation(dir) {
    if (this.conf.scadOutputAbsolute) {
      return this.conf.scadOutputName;
    } else {
      return path.resolve(dir, this.conf.scadOutputName);
    }
  }
  
  createFolders() {
    if (this.conf.scadOutputAbsolute) {
      mkdirp.sync(this.conf.scadOutputName);
    } else {
      this.dirs.forEach(dir => {
        let parse = path.parse(dir);
        if (parse.ext) {
          mkdirp.sync(this.outputLocation(parse.dir));
        } else {
          mkdirp.sync(this.outputLocation(dir));
        }
      });
    }
  }


  start() {
    // Prepare folders
    let parts = [];
    let length = 0;

    this.dirs.forEach(dir => {
      let part = ThreeD.getObjs(dir, this.conf.imgsRecur);
      length += part.length;
      if (part) parts.push(part);
    });

    this.createFolders();

    console.log(parts);
    console.log(this.conf);


    console.log(`Generating ${length} images`);

    // generate images


  }

  
}
module.exports = Process;




