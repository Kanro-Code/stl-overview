const path = require('path')
const fs = require('fs')
const child = require('child_process')
const os = require('os')
const execa = require('execa')

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
    const importName = Openscad.randomUnique()
    const importFile = path.join(this.tempDir, importName)

    // Create important command, making sure path is posix compatible
    // --> posix needed due to openscad weirdness
    origin = origin.split(path.sep).join(path.posix.sep)

    const importCommand = `import("${origin}" );`
    fs.writeFileSync(importFile, importCommand)

    return importName
  }

  async generateImage (output = false, file, conf) {
    if (!output) output = this.tempFile()

    const importFile = this.createImport(file.location)
    const flags = this.prepareFlags(importFile, output, conf)

    const thread = execa(this.exe, flags, { cwd: this.tempDir })

    setTimeout(() => {
      console.log(`Something went wrong with rendering: ${file.location}`)
      thread.cancel()
    }, 60000)

    try {
      await thread
    } catch (err) {
      console.error('Something went wrong with rendering file:')
      console.error(file)
      console.error(conf)
      console.error(output)
      throw err
    }

    return output
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
