const fs = require('fs')
const path = require('path')
const Openscad = require('../lib/openscad')
const mkdirp = require('mkdirp')

class Process {
  constructor (conf, dirs, window) {
    // dirs = [
    //  "/Users/thijs/Downloads/All Pokemon",
    //  "/Users/thijs/Downloads/April",
    //  "/Users/thijs/Downloads/DT+-+CRD+Objective+marker",
    //  "/Users/thijs/Downloads/Marko - Sol Justicar",
    //  "/Users/thijs/Downloads/Mechs",
    //  "/Users/thijs/Downloads/Vulpeana Whitebranch",
    //  "/Users/thijs/Downloads/Lazy+Grid+Clock",
    //  "/Users/thijs/Downloads/Lazy+Grid+Clock (1)",
    //  "/Users/thijs/Downloads/tools-modular-desktop-stand-tweezerplierscrewdriver-v-20-model_files"
    //  // "/Users/thijs/Dekstop/test.stl"
    // ];

    dirs = [
      'D:\\Downloads\\torrents\\[3D Art Guy] Living Saint - May 2020',
      'D:\\Downloads\\torrents\\[3D Art Guy] Marilith Demon - April 2020',
      'D:\\Downloads\\torrents\\[3D Art Guy] Marilith normal - April 2020',
      'D:\\Downloads\\torrents\\[3D Art Guy] Succubus Demon - April 2020',
      'D:\\Downloads\\torrents\\[3D Forge] April 2019',
      'D:\\Downloads\\torrents\\- Blindrune Cult',
      'D:\\Downloads\\torrents\\ hobitonn Bonsay',
      'D:\\Downloads\\torrents\\(Kickstarter - Mia Kay) Familiars and Beasts',
      'D:\\Downloads\\torrents\\[3D Art Guy] Crusader Diorama',
      'D:\\Downloads\\torrents\\[3D Art Guy] Dead Knight',
      'D:\\Downloads\\torrents\\[3D Art Guy] GreatJaw Orc Fighter',
      'D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_Arm.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_FINAL.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_Hand.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_WHOLE.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragonlionne_FINAL.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragonlionne_Head.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragonlionne_NoBase_WHOLE.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragonlionne_Peg.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragonlionne_Tail.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragonlionne_Tail2.stl',
      'D:\\Desktop\\STL Temp TEst\\Dragonlionne_WHOLE.stl',
      'D:\\Desktop\\STL Temp TEst\\DragonTurtle'
    ]
    conf.scadExe = 'C:\\Program Files\\OpenSCAD\\openscad.exe'
    this.dirs = dirs
    this.window = window
    this.conf = conf

    const scad = new Openscad(conf.scadExe)
    this.conf.scadExe = scad.validateExe()

    const imgW = Math.floor(this.conf.outputW / this.conf.stitchColumns)
    this.conf.imgW = imgW
    this.conf.imgH = imgW
    this.conf.outputW = imgW * this.conf.stitchColumns

    console.log(this.conf)
  }

  outputLocation (dir, createFolder = false) {
    let output

    if (this.conf.scadOutputAbsolute) {
      output = this.conf.scadOutputName
    } else {
      if (fs.statSync(dir).isFile()) {
        dir = path.parse(dir).dir
      };
      output = path.resolve(dir, this.conf.scadOutputName)
    }

    if (createFolder) {
      mkdirp.sync(this.conf.scadOutputName)
    }
    return output
  }

  outputName (stl) {
  }

  async start () {
  }
}

module.exports = Process
