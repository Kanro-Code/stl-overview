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
    this.metaEnabled = this.conf.misc.metaEnabled
    this.metaBg = this.conf.metaBg || '#ffffff'
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
      .crop(img.bitmap.width * 0.150, // x crop start
        img.bitmap.height * 0.150, // y crop start
        img.bitmap.width * 0.700, // w total
        img.bitmap.height * 0.700) // h total
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

    // Default to smallest available font
    return fonts[Object.keys(fonts)[0]]
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

  downsizeText (text, maxWidth) {
    for (let i = text.length; i > 0; i--) {
      if (Jimp.measureText(this.font, text) < maxWidth) {
        return text
      } else {
        text = text.substring(0, text.length - 4) + '...'
      }
    }

    return ''
  }

  appendText (image, file) {
    const bgXOffset = 0.02 * image.bitmap.width
    const bgWidth = image.bitmap.width - bgXOffset * 2
    const bgHeight = this.textHeight + (0.03 * image.bitmap.height)
    const strokeW = Math.ceil(bgWidth / 450)

    const bg = new Jimp(bgWidth, bgHeight, '#000000')
    const border = new Jimp(bgWidth - strokeW * 2, bgHeight - strokeW * 2, this.metaBg)
    bg.composite(border, strokeW, strokeW)

    let textFile = path.parse(file.location).base
    textFile = this.downsizeText(textFile, bgWidth * 0.9)

    const opt = {
      text: textFile,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
    }

    bg.print(this.font, 0, 0, opt, bgWidth, bgHeight)

    image.composite(bg,
      bgXOffset,
      image.bitmap.height - bgHeight - bgXOffset
      , {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacitySource: 0.8,
        opacityDest: 1
      }
    )

    return image
  }

  compositeSingle (panel, file, key, font) {
    return new Promise((resolve, reject) => {
      const buffer = fs.readFileSync(file.image)
      Jimp.create(buffer)
        .then(image => {
          this.resizeAndZoom(image)
          if (this.metaEnabled) {
            this.appendText(image, file)
          }
          panel.composite(image, this.getXCoor(key), this.getYCoor(key))
          resolve(panel)
        })
    })
  }

  async compositeImages (panel) {
    for (let i = 0; i < this.files.length; i++) {
      await this.compositeSingle(panel, this.files[i], i)
    }
  }

  deleteExisting (output) {
    fs.unlinkSync(output)
  }

  init () {
    return new Promise(async (resolve, reject) => {
      var panel = new Jimp(this.w, this.h, '#000000')
      const textHeight = this.imgH * 0.1
      this.textHeight = textHeight
      this.font = await this.getFont(textHeight)
      // Get right font size for rest of composition, 20% of height
  
      // Compose each file onto panel
      await this.compositeImages(panel)
  
      // Write panel to disk
      mkdirp.sync(path.parse(this.output).dir)
      panel.write(this.output, (err) => {
        if (err) reject(err)
        resolve()
      })
    })
  }
}

module.exports = Stitch
