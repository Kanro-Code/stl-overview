const fs = require('fs')
const path = require('path')
const Openscad = require('../lib/openscad')
const ThreeD = require('../lib/threed')
const mkdirp = require('mkdirp')
const async = require('async')

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
    this.scad = conf.scad
    this.scadExe = 'C:\\Program Files\\OpenSCAD\\openscad.exe'
    this.process = conf.process
    this.dirs = dirs
    this.window = window

    const imgW = Math.floor(
      this.process.outputW / this.process.columns
    )

    this.scad.w = imgW
    this.scad.h = imgW
    this.process.outputW = imgW * this.process.stitchColumns

  }

  initGen (objs, scad) {
    const images = {}
    return new Promise((resolve, reject) => {
      async.forEachOfLimit(objs, this.process.maxProcess,
        async (obj, key) => {
          const image = await obj.generateImage(null, scad, this.scad)
          images[key] = image
        }, (err) => {
          if (err) reject(err)
          resolve(images)
        })
    })
  }

  async overview (dir) {
    // Get all objects from folder
    const scad = new Openscad(this.scadExe, this.scad)

    const files = ThreeD.getObjs(
      dir, this.process.recur,
      this.process.imgsSortedBy
    )

    // Cut array to imgsMax size
    if (files.length > this.process.imgsMax &&
    this.process.imgsMax !== 0) {
      const cut = files.length - this.process.imgsMax
      files.splice(this.process.imgsMax, cut)
    }

    const time = new Date().getTime()
    console.log("get here")
    const images = await this.initGen(files, scad)
    console.log(`getting all took ${new Date().getTime() - time}`)
    console.log("and here")
  }

  async start () {
    console.log("hi?")
    this.overview(this.dirs[1])
  }

  outputLocation (dir, createFolder = false) {
    let output

    if (this.c.scadOutputAbsolute) {
      output = this.c.scadOutputName
    } else {
      if (fs.statSync(dir).isFile()) {
        dir = path.parse(dir).dir
      };
      output = path.resolve(dir, this.c.scadOutputName)
    }

    if (createFolder) {
      mkdirp.sync(this.c.scadOutputName)
    }
    return output
  }

  outputName (stl) {
  }
}

module.exports = Process
