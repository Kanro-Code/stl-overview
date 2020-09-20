const path = require('path')
const Openscad = require('../lib/openscad')
const ThreeD = require('../lib/threed')
const Stitch = require('../lib/stitch')
const async = require('async')

class Process {
  constructor (conf, dirs, bars) {
    // dirs = [
    //   '/Users/thijs/Downloads/All Pokemon',
    //   '/Users/thijs/Downloads/April',
    //   '/Users/thijs/Downloads/DT+-+CRD+Objective+marker',
    //   '/Users/thijs/Downloads/Marko - Sol Justicar',
    //   '/Users/thijs/Downloads/Mechs',
    //   '/Users/thijs/Downloads/Vulpeana Whitebranch',
    //   '/Users/thijs/Downloads/Lazy+Grid+Clock',
    //   '/Users/thijs/Downloads/Lazy+Grid+Clock (1)',
    //   '/Users/thijs/Downloads/tools-modular-desktop-stand-tweezerplierscrewdriver-v-20-model_files',
    //   '/Users/thijs/Dekstop/test.stl'
    // ]

    // dirs = [
    //   'D:\\Desktop\\STL Temp\\[DO3D] Flash - Helmet - Justice League',
    //   'D:\\Desktop\\STL Temp\\[DO3D] Joker - gun - Suicide Squad',
    //   'D:\\Desktop\\STL Temp\\[DO3D] Subzero - Mask - Mortal Kombat',
    //   'D:\\Desktop\\STL Temp\\[Exequiel Devoto] Batman-Sanity Diorama',
    //   'D:\\Desktop\\STL Temp\\[Ghamak] Sci-Fi August 2020 (with support)',
    //   'D:\\Desktop\\STL Temp\\[Kickstarter - War Scenery] Apocalypse Fortress',
    //   'D:\\Desktop\\STL Temp\\[Patreon - Asgard Rising] April 2020',
    //   'D:\\Desktop\\STL Temp\\[Patreon - Mini Flayer Miniatures] April 2020 Release',
    //   'D:\\Desktop\\STL Temp\\[Patreon - Wyvern Tiles] Outdoors',
    //   'D:\\Desktop\\STL Temp\\[3D Art Guy] Marilith Demon - April 2020',
    //   'D:\\Desktop\\STL Temp\\[3DAlienWorlds] Necrontyr Arena Files',
    //   'D:\\Desktop\\STL Temp\\[Black Scrolls Games] Treasure Pile with Column'
    // ]
    // dirs = [
    // 'C:\\Torrent Temp\\3D Miniature Models - Mar 2020'
    // ]
    this.conf = conf
    this.conf.scadExe = 'D:\\Downloads\\zip\\OpenSCAD-2019.05-x86-64\\openscad-2019.05\\openscad.exe'
    // this.conf.scadExe = '/Applications/OpenSCAD.app'

    this.dirs = dirs
    this.bars = bars

    const imgW = Math.floor(
      this.conf.process.outputW / this.conf.process.columns
    )

    this.conf.scad.w = imgW
    this.conf.scad.h = imgW

    this.scad = new Openscad(this.conf.scadExe, this.conf.scad)
  }

  initGen (files) {
    this.bars[1].setup(0, files.length, 1)
    return new Promise((resolve, reject) => {
      async.eachLimit(
        files,
        this.conf.process.maxProcess,
        async (file) => {
          await file.generateImage(null, this.scad, this.conf.scad)
          this.bars[1].add()
        }
      ).then(() => {
        this.bars[1].finish()
        resolve()
      }).catch(e => {
        if (e) reject(e)
      })
    })
  }

  trimFiles (files) {
    const imgsMax = this.conf.process.imgsMax
    if (this.conf.process.imgsMax !== 0) {
      const toBeCut = ((files.length - imgsMax) <= 0) ? 0 : files.length - imgsMax
      console.log(files)
      files.splice(imgsMax, toBeCut)
      return files
    } else {
      return files
    }
  }

  getFilesAndTrim (dir) {
    console.log(dir, this.conf)
    const files = ThreeD.getObjs(
      dir, this.conf.process.recur,
      this.conf.process.imgsSortedBy
    )

    // Cut array to imgsMax size
    return this.trimFiles(files)
  }

  async generateScad (dir) {
    const files = this.getFilesAndTrim(dir)

    const time = new Date().getTime()
    await this.initGen(files)
    console.log(`getting all took ${new Date().getTime() - time}`)
    return files
  }

  async stitch (threeds, dir) {
    const process = new Stitch(
      threeds,
      this.outputLocation(dir),
      this.conf
    )
    console.log(`Starting stitch ${dir}`)
    await process.init()
    console.log(`Finished stitch ${dir}`)
  }

  async start () {
    this.bars[0].setup(0, this.dirs.length, 1)
    for (let i = 0; i < this.dirs.length; i++) {
      this.bars[2].setup(0, 1, 0)
      const threeds = await this.generateScad(this.dirs[i])
      this.bars[1].add()
      this.bars[2].add()
      await this.stitch(threeds, this.dirs[i])
      this.bars[2].finish()
      this.bars[0].add()

    }
    this.bars[0].finish()
    console.log('EVERYTHING WENT FINE AND HAS COMPLETED')
    this.cleanup()
  }

  outputName (dir) {
    return path.parse(dir).name + '.png'
  }

  outputFolder (dir) {
    const parse = path.parse(dir)
    const root = (parse.ext) ? parse.dir : dir
    const folder = path.resolve(root, this.conf.process.outputLocation)
    return folder
  }

  outputLocation (dir) {
    const confLoc = this.conf.process.outputLocation
    if (path.isAbsolute(confLoc)) {
      return path.join(confLoc, this.outputName(dir))
    } else {
      const folder = this.outputFolder(dir)
      return path.join(folder, this.outputName(dir))
    }
  }

  cleanup () {
    this.scad.clearTempDir()
  }
}

module.exports = Process
