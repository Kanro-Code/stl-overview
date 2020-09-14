const path = require('path')
const fs = require('fs')
const child = require('child_process')
const os = require('os')
const Jimp = require('jimp')

class Openscad {
  constructor (exe, flags) {
    this.exe = exe

    const defFlags = {
      autocenter: true,
      viewall: true,
      fullrender: true,
      ortho: true,
      colorscheme: 'Cornfield'
    }

    this.flags = { ...defFlags, ...flags }
  };

  validateExe () {
    // Shell command to test if openscad reacts, not without fault, but good enough
    const output = child.spawnSync(this.exe, ['--info'])
    return (output.status === 0) ? this.exe : false
  };

  prepareFlags (impFile, output, settings) {
    const flags = [
      `-o${output}`,
      `--imgsize=${settings.w * 2},${settings.h * 2}`,
      `--colorscheme=${this.flags.colorscheme}`,
      impFile
    ]

    if (this.flags.autocenter) { flags.push('--autocenter') }
    if (this.flags.viewall) { flags.push('--viewall') }
    if (this.flags.fullrender) { flags.push('--render') }
    if (this.flags.ortho) { flags.push('--projection=o') }
    return flags
  }

  static randomUnique () {
    const number = Math.random()
    number.toString(36)
    return number.toString(36).substr(2)
  }

  createImport (origin) {
    const impFile = path.join(this.tempDir, Openscad.randomUnique())

    // Create important command, making sure path is posix compatible
    // --> posix needed due to openscad weirdness
    origin = origin.split(path.sep).join(path.posix.sep)

    const importCommand = `import("${origin}", convexity=10 );`
    fs.writeFileSync(impFile, importCommand)

    return impFile
  }

  async resizeAndZoom (loc, settings) {
    // return new Promise((resolve, reject) => {
    //   Jimp.read(loc)
    //     .then(img => {
    //       const cropX = img.bitmap.width * 0.1
    //       const cropY = img.bitmap.height * 0.1
    //       const cropW = img.bitmap.width * 0.8
    //       const cropH = img.bitmap.height * 0.8
    //       return img
    //         .crop(cropX, cropY, cropW, cropH)
    //         .resize(settings.w, settings.h, Jimp.RESIZE_BICUBIC)
    //         .write(loc)
    //         .then(() => {
    //           resolve()
    //         })
    //     }).catch(e => reject(e))
    // })

    // await Jimp.read(loc, (err, img) => {
    //   if (err) throw err
    //   img
    //     .crop(
    //       img.bitmap.width * 0.1, // x crop start
    //       img.bitmap.height * 0.1, // y crop start
    //       img.bitmap.width * 0.8, // w total
    //       img.bitmap.height * 0.8 // h total
    //     )
    //     .resize(settings.w, settings.h, Jimp.RESIZE_BICUBIC)
    //     .write(loc)
    // })

    return new Promise((resolve, reject) => {
      Jimp.read(loc)
        .then(img => {
          return img
            .crop(
              img.bitmap.width * 0.1, // x crop start
              img.bitmap.height * 0.1, // y crop start
              img.bitmap.width * 0.8, // w total
              img.bitmap.height * 0.8 // h total
            )
            .resize(settings.w, settings.h, Jimp.RESIZE_BICUBIC)
            .write(loc)
        })
        .then(() => {
          resolve()
        })
        .catch(e => reject(e))
      // , (err, img) => {
      //   if (err) throw err
      //   img
      //     .crop(
      //       img.bitmap.width * 0.1, // x crop start
      //       img.bitmap.height * 0.1, // y crop start
      //       img.bitmap.width * 0.8, // w total
      //       img.bitmap.height * 0.8 // h total
      //     )
      //     .resize(settings.w, settings.h, Jimp.RESIZE_BICUBIC)
      //     .write(loc)
      // })
    })
  }

  generateImage (output = false, threed, settings) {
    return new Promise((resolve, reject) => {
      if (!output) {
        output = path.join(this.tempDir, Openscad.randomUnique() + '.png')
      }

      const location = threed.location
      const impFile = this.createImport(location)
      const flags = this.prepareFlags(impFile, output, settings)

      const thread = child.spawn(this.exe, flags)
      thread.on('close', async (code) => {
        if (code === 0) {
          let time = new Date().getTime()

          await this.resizeAndZoom(output, settings)
          console.log(`took: ${new Date().getTime() - time}`)
          resolve(output)
        } else {
          reject(new Error(`spawn came back with error code ${code}`))
        }
      })
    })
  }

  clearTempDir () {
    try {
      const files = fs.readdirSync(this.tempDir)

      files.forEach(file => {
        fs.unlinkSync(path.join(this.tempDir, file))
      })

      return true
    } catch (e) {
      return false
    }
  }

  set exe (exe) {
    if (!exe) throw new Error('exe required')

    // Change .app to link to internal exe - OSX
    if (process.platform === 'darwin') { exe = path.join(exe, 'Contents/MacOS/Openscad') }
    this._exe = exe
  };

  get exe () {
    return this._exe
  }

  get tempDir () {
    if (this._tempDir) return this._tempDir

    const tmpDir = path.join(os.tmpdir())
    this._tempDir = fs.mkdtempSync(`${tmpDir}${path.sep}`)

    return this._tempDir
  }
}

module.exports = Openscad
