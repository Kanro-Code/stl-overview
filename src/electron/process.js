const path = require('path')
const Openscad = require('../lib/openscad')
const ThreeD = require('../lib/threed')
const Stitch = require('../lib/stitch')
const mkdirp = require('mkdirp')
const async = require('async')

class Process {
  constructor (conf, dirs, window) {
    // dirs = [
    //   '/Users/thijs/Downloads/All Pokemon',
    //   '/Users/thijs/Downloads/April',
    //   '/Users/thijs/Downloads/DT+-+CRD+Objective+marker',
    //   '/Users/thijs/Downloads/Marko - Sol Justicar',
    //   '/Users/thijs/Downloads/Mechs',
    //   '/Users/thijs/Downloads/Vulpeana Whitebranch',
    //   '/Users/thijs/Downloads/Lazy+Grid+Clock',
    //   '/Users/thijs/Downloads/Lazy+Grid+Clock (1)',
    //   '/Users/thijs/Downloads/tools-modular-desktop-stand-tweezerplierscrewdriver-v-20-model_files'
    //   // "/Users/thijs/Dekstop/test.stl"
    // ]

    // dirs = [
    //   'D:\\Downloads\\torrents\\[3D Art Guy] Living Saint - May 2020',
    //   'D:\\Downloads\\torrents\\[3D Art Guy] Marilith Demon - April 2020',
    //   'D:\\Downloads\\torrents\\[3D Art Guy] Marilith normal - April 2020',
    //   'D:\\Downloads\\torrents\\[3D Art Guy] Succubus Demon - April 2020',
    //   'D:\\Downloads\\torrents\\[3D Forge] April 2019',
    //   'D:\\Downloads\\torrents\\- Blindrune Cult',
    //   'D:\\Downloads\\torrents\\ hobitonn Bonsay',
    //   'D:\\Downloads\\torrents\\(Kickstarter - Mia Kay) Familiars and Beasts',
    //   'D:\\Downloads\\torrents\\[3D Art Guy] Crusader Diorama',
    //   'D:\\Downloads\\torrents\\[3D Art Guy] Dead Knight',
    //   'D:\\Downloads\\torrents\\[3D Art Guy] GreatJaw Orc Fighter',
    //   'D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_Arm.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_FINAL.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_Hand.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragontaur\\Dragontaur_WHOLE.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragonlionne_FINAL.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragonlionne_Head.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragonlionne_NoBase_WHOLE.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragonlionne_Peg.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragonlionne_Tail.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragonlionne_Tail2.stl',
    //   'D:\\Desktop\\STL Temp TEst\\Dragonlionne_WHOLE.stl',
    //   'D:\\Desktop\\STL Temp TEst\\DragonTurtle'
    // ]
    dirs = [
      'C:\\Torrent Temp\\3D Miniature Models - Mar 2020'
    ]
    this.conf = conf
    this.conf.scadExe = 'C:\\Program Files\\OpenSCAD\\openscad.exe'
    // this.conf.scadExe = '/Applications/OpenSCAD.app'

    this.dirs = dirs
    this.window = window

    const imgW = Math.floor(
      this.conf.process.outputW / this.conf.process.columns
    )

    this.conf.scad.w = imgW
    this.conf.scad.h = imgW

    this.scad = new Openscad(this.conf.scadExe, this.conf.scad)
  }

  executeGen (file, key, callback) {
    file.generateImage(null, this.scad, this.conf.scad)
      .then(() => {
        callback()
      })
  }

  initGen (files) {
    return new Promise((resolve, reject) => {
      async.forEachOfLimit(
        files,
        this.conf.process.maxProcess,
        this.executeGen.bind({
          scad: this.scad,
          conf: this.conf
        }),
        (err) => {
          if (err) reject(err)
          resolve()
        })
    })
  }

  getFilesAndTrim (dir) {
    const files = ThreeD.getObjs(
      dir, this.conf.process.recur,
      this.conf.process.imgsSortedBy
    )

    // Cut array to imgsMax size
    if (this.conf.process.imgsMax !== 0) {
      files.splice(this.conf.process.imgsMax, files.length)
    }

    return files
  }

  async generateScad (dir) {
    // Get all objects from folder
    const files = this.getFilesAndTrim(dir)
    console.log(files)

    const time = new Date().getTime()
    await this.initGen(files)
    console.log(`getting all took ${new Date().getTime() - time}`)
    return files

  }

  async stitch(files) {

  }

  async start () {
    const collection = []

    for (let i = 0; i < this.dirs.length; i++) {
      const threeds = await this.generateScad(this.dirs[i])
      const stitch = new Stitch(
        threeds,
        this.outputLocation(this.dirs[i], true),
        this.conf
      )

      collection.push(stitch)
    }

    console.log(collection)
  }

  outputName (dir) {
    const parse = path.parse(dir)
    console.log(parse)

    return 'hi'
    // /test/deasd/adasdasd/foldername - returns foldername.png

    // /asdasd/asd/asd/asd/asd/asd/something.stl return something.png

  }

  outputLocation (dir, createFolder = false) {
    const confLoc = this.conf.process.outputLocation
    if (path.isAbsolute(confLoc)) {
      mkdirp.sync(confLoc)
      return path.join(confLoc, this.outputName(dir))
    } else {
      let folder = path.resolve(dir, confLoc)
      mkdirp.sync(folder)
      return path.join(folder, this.outputName(dir))
    }

  }
}

module.exports = Process
