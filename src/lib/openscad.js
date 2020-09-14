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

  prepareFlags (importFile, output, conf) {
    const flags = [
      `-o${output}`,
      `--imgsize=${conf.w * 2},${conf.h * 2}`,
      `--colorscheme=${this.flags.colorscheme}`,
      importFile
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
    const importFile = path.join(this.tempDir, Openscad.randomUnique())

    // Create important command, making sure path is posix compatible
    // --> posix needed due to openscad weirdness
    origin = origin.split(path.sep).join(path.posix.sep)

    const importCommand = `import("${origin}", convexity=10 );`
    fs.writeFileSync(importFile, importCommand)

    return importFile
  }

  async resizeAndZoom (loc, conf) {
    try {
      const img = await Jimp.read(loc)
      img
        .crop(img.bitmap.width * 0.1, // x crop start
          img.bitmap.height * 0.1, // y crop start
          img.bitmap.width * 0.8, // w total
          img.bitmap.height * 0.8) // h total
        .resize(conf.w, conf.h, Jimp.RESIZE_BICUBIC)
        .write(loc)
      return loc
    } catch (e) {
      if (e) throw e
    }
  }

  async generateImage (output = false, file, conf) {
    if (!output) output = this.tempFile()

    const importFile = this.createImport(file.location)
    const flags = this.prepareFlags(importFile, output, conf)
    const thread = child.spawnSync(this.exe, flags)

    if (thread.status !== 0) {
      throw new Error(`openscad error exit ${thread.status} - ${thread.output[2].toString()}`)
    }

    const loc = await this.resizeAndZoom(output, conf)
    return loc
  }

  clearTempDir () {
    const files = fs.readdirSync(this.tempDir)

    files.forEach(file => {
      fs.unlink(path.join(this.tempDir, file), (e) => {
        if (e) throw e
      })
    })
  }

  tempFile () {
    return path.join(this.tempDir, Openscad.randomUnique() + '.png')
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
