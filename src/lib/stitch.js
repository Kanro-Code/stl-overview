const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')
const Jimp = require('jimp')

class Stitch {
  constructor (files, output, conf) {
    this.files = files
    this.conf = conf
    this.imgH = this.conf.scad.h
    this.imgW = this.conf.scad.w
    this.columns = this.conf.process.columns
    this.output = output
    this.calcSizes()
  }

  getXCoor (key) {
    return key % this.columns * this.imgW
  }

  getYCoor (key) {
    return Math.floor(key / this.columns) * this.imgH
  }

  resizeAndZoom (img) {
    img
      .crop(img.bitmap.width * 0.125, // x crop start
        img.bitmap.height * 0.125, // y crop start
        img.bitmap.width * 0.75, // w total
        img.bitmap.height * 0.75) // h total
      .resize(this.imgW, this.imgH, Jimp.RESIZE_BICUBIC)
    return img
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

  compositeSingle (panel, file, key) {
    return new Promise((resolve, reject) => {
      const buffer = fs.readFileSync(file.image)
      Jimp.create(buffer)
        .then(image => {
          this.resizeAndZoom(image)
          panel.composite(image, this.getXCoor(key), this.getYCoor(key))
          resolve(panel)
        })
    })
  }

  async compositeImages (panel) {
    for (let i = 0; i < this.files.length; i++) {
      await this.compositeSingle(panel, this.files[i], i)
    }
    mkdirp.sync(path.parse(this.output).dir)
    panel.write(this.output)
  }

  deleteExisting (output) {
    fs.unlinkSync(output)
  }

  async init () {
    var panel = new Jimp(this.w, this.h, '#000000')
    await this.compositeImages(panel)

    await panel.write(this.output)
  }
}

module.exports = Stitch
