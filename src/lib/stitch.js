const Jimp = require('jimp')
const path = require('path')
const mkdirp = require('mkdirp')
const async = require('async')
const fs = require('fs')

class Stitch {
  constructor (files, output, conf) {
    this.files = files
    this.conf = conf
    this.imgH = this.conf.scad.h
    this.imgW = this.conf.scad.w
    this.columns = this.conf.process.columns
    this.output = output
    this.calcSizes()

    mkdirp.sync(output)
  }

  async resizeAndZoom (loc, conf) {
    try {
      const img = await Jimp.read(loc)
      console.log('resizing: ' + path.parse(loc).base)
      img
        .crop(img.bitmap.width * 0.1, // x crop start
          img.bitmap.height * 0.1, // y crop start
          img.bitmap.width * 0.8, // w total
          img.bitmap.height * 0.8) // h total
        .resize(conf.w, conf.h, Jimp.RESIZE_BICUBIC)
        .write(loc)
      console.log('DONE resizing: ' + path.parse(loc).base)
      return loc
    } catch (e) {
      console.log(e)
      if (e) throw e
    }
  }

  calcSizes () {
    if (this.files.length > this.columns) {
      this.w = this.imgW * this.columns
    } else {
      this.w = this.imgW * this.files.length
    }
    this.h = Math.ceil(
      this.files.length / this.columns
    ) * this.imgH
  }

  compositeSingle (panel, file, key, callback) {
    let image = file.image
    console.log(image)
    Jimp.read(image)
      .then(image => {
        console.log(image)
      }).catch(err => { throw err })

    // compositeSingle (panel, file, key, callback) {
    //   const img = file.image
    //   console.log(file)
    //   return Jimp.read(img, (err, img) => {
    //     if (err) throw err
    //     console.log('hi')
    //     img.resize(this.imgW, this.imgH, Jimp.RESIZE_BICUBIC)
    //     panel.composite(img, 0, 0)
    //     console.log(panel)
    //     callback()
    //   })
    // }
    // let test = await Jimp.read(image)
    //   .resize(this.imgW, this.imgH, Jimp.RESIZE_BICUBIC)
      
    // Jimp.read(file.image)
    //   .then(image => {
    //     console.log('hi')
    //     return this.resizeImage(image)
    //   })
    //   .then(image => {
    //     console.log(image)
    //   }).catch(err => {
    //     throw err
    //   })
    // this.loadImage(file)
    //   .then((image) => {
    //     console.log(key)

    //     this.resizeImage(image)
    //     panel.composite(image, 0, 0)
    //     // panel.composite(image, this.getXCoor(key), this.getYCoor(key))

    //     callback()
    //   })
    //   .catch(err => { throw err })
  }

  compositeImages (panel) {
    return new Promise((resolve, reject) => {
      async.forEachOfLimit(
        this.files,
        32,
        this.compositeSingle.bind(this, {panel: panel}),
        (err) => {
          if (err) reject(err)
          resolve()
        }
      )
    })
  }

  async init () {
    var panel = new Jimp(this.w, this.h, '#000000')
    await this.compositeImages(panel)
    console.log(this.output)

    await panel.write(this.output)

    console.log(panel)
  }
}

// class Stitch {
//   constructor (list, conf) {
//     this.conf = conf

//     this.barW = Math.floor(this.conf.imgW * this.conf.stitchBarPercentage)
//     this.barH = 24
//     this.barWOffset = (conf.imgW - this.barW) / 2
//     this.barHOffset = 10
//     this.barStrokeWeight = 1
//     this.font = Jimp.FONT_SANS_16_BLACK

//     this.list = list

//     if (list.length < conf.stitchColumns) {
//       this.maxColumns = list.length
//     } else {
//       this.maxColumns = conf.stitchColumns
//     }

//     this.stitchW = this.maxColumns * this.conf.imgW
//     this.stitchH = Math.ceil(this.list.length / this.maxColumns) * this.conf.imgH
//   }

//   async execute () {
//     var panel = new Jimp(
//       this.stitchW,
//       this.stitchH,
//       this.conf.stitchBackground,
//       (err, image) => {
//         if (err) throw err
//       })

//     return new Promise((resolve, reject) => {
//       async.forEachOf(this.list, (value, key, callback) => {
//         Jimp.read(value.image, (err, image) => {
//           if (err) return callback(err)

//           // add border behind image text
//           this.getBar(this.conf, value.parse.name)
//             .then(bar => {
//               let barPosY = image.bitmap.height - this.barH
//               barPosY = barPosY - this.conf.stitchBarHOffset
//               image.composite(bar, this.barWOffset, barPosY)

//               // add to composition
//               panel.composite(image, this.getXCoor(key), this.getYCoor(key))
//               callback()
//             })
//         })
//       }, (err) => {
//         if (err) console.error(err.message)

//         const output = path.join(this.conf.scadOutputDir, this.conf.scadOutputName)
//         panel.write(output)
//         resolve(output)
//       })
//     })
//   }

//   async getBar (conf, text) {
//     const c = this.conf

//     const bar = new Jimp(this.barW, this.barH, c.stitchBackground)
//     const insert = new Jimp(
//       this.barW - (this.barStrokeWeight * 2),
//       this.barH - (this.barStrokeWeight * 2),
//       'white')

//     bar.composite(insert, this.barStrokeWeight, this.barStrokeWeight)
//     const barTextWidth = this.barW - (this.barStrokeWeight * 2) - 5

//     const promise = Jimp.loadFont(this.font)
//       .then(font => {
//         text = text.toUpperCase()
//         text = this.barLimitText(text, barTextWidth, font)

//         bar.print(font, 0, conf.stitchBarTextHOffset, {
//           text: text,
//           alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
//           alignmentY: Jimp.VERTICAL_ALIGN_TOP
//         }, this.barW)

//         return bar
//       })
//       .catch(err => { throw err })

//     return await promise
//   }

//   barLimitText (text, maxWidth, font) {
//     if (maxWidth > Jimp.measureText(font, text)) {
//       return text
//     } else {
//       text = text.substring(0, text.length - 4) + '...'
//       return this.barLimitText(text, maxWidth, font)
//     }
//   }

//   barWriteText (bar, barConf, text) {

//   }

//   getXCoor (key) {
//     return key % this.maxColumns * this.conf.imgW
//   }

//   getYCoor (key) {
//     return Math.floor(key / this.maxColumns) * this.conf.imgH
//   }
// }

module.exports = Stitch
