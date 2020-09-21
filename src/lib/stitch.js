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

  calculateFont (height) {
    const fonts = {
      9: Jimp.FONT_SANS_8_BLACK,
      14: Jimp.FONT_SANS_10_BLACK,
      17: Jimp.FONT_SANS_12_BLACK,
      18: Jimp.FONT_SANS_14_BLACK,
      20: Jimp.FONT_SANS_16_BLACK,
      36: Jimp.FONT_SANS_32_BLACK,
      72: Jimp.FONT_SANS_64_BLACK,
      143: Jimp.FONT_SANS_128_BLACK
    }
    const keys = Object.keys(fonts)

    for (let i = keys.length; i > 0; i--) {
      if (height > keys[i]) {
        return fonts[keys[i]]
      }
    }

    return false
  }

  getFont (height) {
    return new Promise((resolve, reject) => {
      const font = this.calculateFont(height)
      if (!font) throw Error('Image is too small for text at the set height')
      Jimp.loadFont(font)
        .then(font => {
          resolve(font)
        }).catch(e => reject(e))
    })
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

  async appendText (image, meta) {
    meta = {
      text: 'ThereIsAFileHere.stl'
    }

    image.print(
      this.font,
      0,
      this.imgH * 0.95,
      meta.text
    )

    return image
  }

  compositeSingle (panel, file, key) {
    return new Promise((resolve, reject) => {
      const buffer = fs.readFileSync(file.image)
      Jimp.create(buffer)
        .then(image => {
          this.resizeAndZoom(image)
          this.appendText(image)
          panel.composite(image, this.getXCoor(key), this.getYCoor(key))
          resolve(panel)
        })
    })
  }

  async compositeImages (panel) {
    for (let i = 0; i < this.files.length; i++) {
      await this.compositeSingle(panel, this.files[i], i)
    }
    panel.write(this.output)
  }

  deleteExisting (output) {
    fs.unlinkSync(output)
  }

  async init () {
    var panel = new Jimp(this.w, this.h, '#000000')

    // Get right font size for rest of composition, 20% of height
    const maxFontHeight = this.imgH * 0.05
    console.log(maxFontHeight)
    this.font = await this.getFont(maxFontHeight)

    // Compose each file onto panel
    await this.compositeImages(panel)

    // Write panel to disk
    mkdirp.sync(path.parse(this.output).dir)
    await panel.write(this.output)
  }
}

module.exports = Stitch
