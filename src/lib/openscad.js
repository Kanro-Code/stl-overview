const path = require('path')
const fs = require('fs')
const child = require('child_process')
const os = require('os')

/**
 * Class with openscad wrapper for simple image generation
 */
class Openscad {
  /**
   * Create openscad instance, with exe and some settings
   * @constructor
   * @param {string} exe - location executable of Openscad. Requires .app or .exe
   * @param {Object} flags - settings or flags used when rendering images
   * @param {boolean} flags.autocenter - center and turn object to a sideview, default true,
   * if model was exported wrong this setting won't help
   * @param {boolean} flags.viewall - zoom out on object to have entirity fall inside image, default true
   * @param {boolean} flags.fullrender - use fullrender instead of preview generation, default false
   * @param {boolean} flags.ortho - using orthopedic rendering instead of perspective(default)
   * @param {string} flags.colorscheme - colorscheme image for render, following available:
   * 'Cornfield' (default), 'BeforeDawn', 'DeepOcean', 'Metallic', 'Nature', 'Solarized',
   * 'Starnight', 'Sunset', 'Tomorrow Night', 'Tomorrow'
   */
  constructor (exe, flags) {
    this.exe = exe

    const defaults = {
      autocenter: true,
      viewall: true,
      fullrender: false,
      ortho: true,
      colorscheme: 'Cornfield'
    }

    this.flags = { ...defaults, ...flags }
  };

  /**
   * @returns {boolean} whether initial commandline poke fails on openscad executable
   */
  validateExe () {
    // Shell command to test if openscad reacts, not without fault, but good enough
    const output = child.spawnSync(this.exe, ['--info'])
    return (output.status === 0) ? this.exe : false
  };

  /**
   * Prepares and returns array of strings that will be used in a shell together with the openscad executable
   * @param {string} importFile - path of file where the import command resides for a single 3d object
   * @param {string} output - location exported image
   * @param {Object} dimensions - dimensions for exported image
   * @param {number} dimensions.w - width exported image
   * @param {number} dimensions.h - height exported image
   * @returns {string[]} - returns flags prepared for using in a shell together with openscad executable
   */
  prepareFlags (importFile, output, dimensions) {
    const flags = [
      `-o${output}`, // no space after -o, bug in openscad 2019/2020
      `--imgsize=${dimensions.w},${dimensions.h}`,
      `--colorscheme=${this.flags.colorscheme}`,
      importFile
    ]

    if (this.flags.autocenter) { flags.push('--autocenter') }
    if (this.flags.viewall) { flags.push('--viewall') }
    if (this.flags.fullrender) { flags.push('--render') }
    if (this.flags.ortho) { flags.push('--projection=o') }

    return flags
  }

  /**
   * Create a temporary import file that is required by openscad. Openscad normally has a .scad file with
   * all properties, but for this program it only requires an import command.
   * Import file will be stored in a temp folder, based on what OS you use
   * @param {string} location - path location 3d object
   * @returns {string} - Path to importfile location, stored in a temporary file, see tempDir method
   */
  createImport (location) {
    const importName = randomString(12)
    const importFile = path.join(this.tempDir, importName)

    // Create important command, making sure path is posix compatible
    // --> posix needed due to openscad weirdness
    location = location.split(path.sep).join(path.posix.sep)

    const importCommand = `import("${location}" );`
    fs.writeFileSync(importFile, importCommand)

    return importName
  }

  /**
   * @param  {string} output=false - Location where image should be saved, if left blank will be placed inside
   * a OS dependent temporary folder
   * @param  {string} file
   * @param  {Object threed} conf
   * @returns {string} Path location for the exported image
   */
  generateImage (output = false, threed, conf) {
    return new Promise((resolve, reject) => {
      if (!output) output = this.tempImg()
      const threadOptions = {
        cwd: this.tempDir,
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 5,
        stdio: 'ignore'
      }

      const importFile = this.createImport(threed.location)
      const flags = this.prepareFlags(importFile, output, conf)

      try {
        const thread = child.spawn(this.exe, flags, threadOptions)

        thread.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`child process exited with error code ${code} - during openscad generation`))
          } else {
            thread.kill()
            resolve(output)
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Clears the temporary directory made to storage importfile and generated images
   * Makes sure no lingering files will remain after process is done.
   */
  clearTempDir () {
    const files = fs.readdirSync(this.tempDir)

    files.forEach(file => {
      fs.unlink(path.join(this.tempDir, file), (e) => {
        if (e) throw e
      })
    })
  }

  /**
   * @returns {string} returns 'unique' path and image file name for a temporary save location
   */
  tempImg () {
    return path.join(this.tempDir, randomString(16) + '.png')
  }

  /**
   * @param {string} exe - pass absolute path location executable set exe to instance,
   * and in case of different OS' will append the necessary information to have the executable work
   */
  set exe (exe) {
    if (!exe) throw new Error('exe required')

    // Change .app to link to internal exe - OSX
    if (process.platform === 'darwin') {
      exe = path.join(exe, 'Contents/MacOS/Openscad')
    }

    this._exe = exe
  };

  /**
   * @returns {string} returns executable location of this openscad instance
   */
  get exe () {
    return this._exe
  }

  /**
   * @returns {string} returns path of OS dependent temporary folder, assigned by fs.mkdtemp.
   * This should be a unique folder just for this Openscad instance
   */
  get tempDir () {
    if (this._tempDir) return this._tempDir

    const tmpDir = path.join(os.tmpdir())
    this._tempDir = fs.mkdtempSync(`${tmpDir}${path.sep}`)

    return this._tempDir
  }
}

/**
 * @param  {number} length - length of the random generated string
 * @param  {string} prefix - prefix for string, also used for recursive generation
 * @returns {string} returns randomly generated string with set length
 */
const randomString = (length, prefix) => {
  let string = prefix || ''
  string += Math.random().toString(36).substr(2)

  if (string.length > length) {
    return string.substring(0, length)
  } else {
    return randomString(length, string)
  }
}

module.exports = Openscad
