const path = require('path')
const fs = require('fs')
const child = require('child_process')
const os = require('os')
const execa = require('execa')
const { reject } = require('async')

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
      `-o${output}`, // no space after -o, bug in openscad
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

  static randomUnique (length = 8, prefix) {
    const string = prefix + Math.random().toString(36).substr(2)
    if (string.length > length) {
      return  string.substring(0, length)
    } else {
      return Openscad.randomUnique(length, string)
    }
  }

  createImport (origin) {
    const importName = Openscad.randomUnique(12)
    const importFile = path.join(this.tempDir, importName)

    // Create important command, making sure path is posix compatible
    // --> posix needed due to openscad weirdness
    origin = origin.split(path.sep).join(path.posix.sep)

    const importCommand = `import("${origin}" );`
    fs.writeFileSync(importFile, importCommand)

    return importName
  }
  
  generateImage (output = false, file, conf) {
    return new Promise((resolve, reject) => {
      if (!output) output = this.tempFile()
      let threadOptions = { 
        cwd: this.tempDir, 
        timeout: 120000,
        maxBuffer: 1024*1024 * 5,
        stdio: 'ignore'
      }
  
      const importFile = this.createImport(file.location)
      const flags = this.prepareFlags(importFile, output, conf)
      
      try {
        const thread = child.spawn(this.exe, flags, threadOptions)
        console.log(`Generating: ${path.parse(file.location).base}`)
    
        thread.on('close', (code) => {
          if (code !== 0) {
            reject(`child process exited with error code ${code} - during openscad generation`)
          } else {
            resolve(output)
          }
        })
      } catch(e) {
        reject(e)
      }
    })
  }

  clearTempDir () {
    const files = fs.readdirSync(this.tempDir)

    files.forEach(file => {
      fs.unlink(path.join(this.tempDir, file), (e) => {
        if (e) throw e
      })
    })
  }

  tempFile (extension) {
    let ext = extension || '.png'
    return path.join(this.tempDir, Openscad.randomUnique(16) + ext)
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
