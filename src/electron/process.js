const path = require('path')
const Openscad = require('../lib/openscad')
const ThreeD = require('../lib/threed')
const Stitch = require('../lib/stitch')
const async = require('async')

/**
 * Creates a new Process to generate, sort images, and stitch them together
 * @class
 */
class Process {
	/**
	 * Constructor for Process, where conf a lot of default values, a valid array of dirs is required
	 * and bars given for reporting progress to the end-user
	 * @param {Object} conf - configuration of all user settings
	 * @param {string} conf.scadExe - absolute path to the location of openscad
	 * @param {boolean} conf.autocenter=true - if during image generation the model is orientated in a natural way
	 * @param {boolean} conf.viewall=true - if during image generation the view is zoomed out to contain the full model
	 * @param {boolean} conf.fullrender=true - if during image generation openscad should use preview or full render
	 * @param {boolean} conf.ortho=true - if during image generation openscad should use orthographic or perspective view
	 * @param {string} conf.colorscheme='Cornfield' - colorscheme image for render, following available:
	 * 'Cornfield' (default), 'BeforeDawn', 'DeepOcean', 'Metallic', 'Nature', 'Solarized',
	 * 'Starnight', 'Sunset', 'Tomorrow Night', 'Tomorrow'
	 * @param {boolean} conf.recur=true - if the program should find 3d objects recursively
	 * @param {number} conf.imgsMax=16 - maximum number of objects that get an image generated
	 * @param {string} conf.imgsSortedBy='size' - what method is used to decided which images are on top of the overview,
	 * options are 'size' for sorting based on size on disk, or 'random' for a randomly picked order
	 * @param {number} conf.outputW=1200 - the width in pixels of the overview generated
	 * @param {number} conf.columns=4 - amount of columns of 3d objects in the y axis
	 * @param {boolean} conf.createSinglePreview=false - whether to generate individual images besides the overview
	 * @param {boolean} conf.metaEnabled=true - whether to add meta data under each 3d object preview
	 * @param {number} conf.maxProcess=8 - maximum amount of Openscad shells running at the same time
	 * @param {string} conf.absolute - if chosen in conf.output, the absolute location for output
	 * @param {string} conf.relative='./preview' - if chosen in conf.output, the relative location for output
	 * @param {string} conf.output='relative' -
	 * @param {string[]} dirs - absolute locations of paths/files of potential 3d objects
	 * @param {ProgressBar[]} bars - bars to display progress, bar 0 for overal file/folder progress,
	 * bar 1 for image generation, and bar 2 for final stitching
	 */
	constructor (conf, dirs, bars) {
		const defaults = {
			autocenter: true,
			viewall: true,
			fullrender: true,
			ortho: true,
			colorscheme: 'Cornfield',
			recur: true,
			imgsMax: 16,
			imgsSortedBy: 'size',
			outputW: 1200,
			columns: 4,
			createSinglePreview: false,
			metaEnabled: true,
			maxProcess: 8,
			relative: './preview',
			output: 'relative'
		}

		this.conf = { ...defaults, ...conf }
		this.dirs = dirs
		this.bars = bars

		const imgW = Math.floor(
			this.conf.outputW / this.conf.columns
		)
		// Adjust for outputW that isn't divisble by this.conf.columns into a whole number
		this.conf.outputW = imgW * this.conf.columns
		this.conf.imgW = imgW
		this.conf.imgH = imgW

		this.scad = new Openscad(this.conf.scadExe, {
			autocenter: this.conf.autocenter,
			viewall: this.conf.viewall,
			ortho: this.conf.ortho,
			colorscheme: this.conf.colorscheme
		})
	}

	/**
	 * Executes the generation of images on every ThreeD instance in a staggered manner
	 * @param  {ThreeD[]} files - contains a array of ThreeD instances that all need to
	 * generate an image. Through the async library a limit control is applied to prevent
	 * spawning 100s of shell commands.
	 * @returns {Promise<>} returns nothing on resolve
	 */
	initGen (files) {
		this.bars[1].setup(0, files.length, 1)

		const confScad = {
			imgW: this.imgW * 2,
			imgH: this.imgH * 2
		}

		return new Promise((resolve, reject) => {
			async.eachLimit(
				files,
				this.conf.maxProcess,
				async (file) => {
					await file.generateImage(null, this.scad, confScad)
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

	/**
	 * A function to reduce the number of ThreeD instances based on the imgsMax settings,
	 * if none given will return the given list
	 * @param {ThreeD[]} files - ThreeD instances that require to be trimmed to size
	 * @returns {ThreeD[]} - Returns a trimmed instance, unless no imgsMax is set, then will return
	 * the same list of instances
	 */
	trimFiles (files) {
		const imgsMax = this.conf.imgsMax
		if (this.conf.imgsMax !== 0) {
			const toBeCut = ((files.length - imgsMax) <= 0) ? 0 : files.length - imgsMax
			files.splice(imgsMax, toBeCut)
			return files
		} else {
			return files
		}
	}

	/**
	 * Will scan a folder/file and return any valid ThreeD objects. If given a folder will scan through,
	 * the folders, if given a file will return an array with a single item.
	 * @param {string} dir - absolute path to file/folder of potential 3d object(s)
	 * @returns {ThreeD[]} - returns Threed instances of all eligible files found in path given
	 */
	getFiles (dir) {
		console.log(dir, this.conf)
		const files = ThreeD.getObjs(
			dir, this.conf.recur,
			this.conf.imgsSortedBy
		)

		return files
	}

	/**
	 * From an array of absolute paths will pull all eligible 3d objects, turn them
	 * an array into ThreeD instances, will sort and trim the objects to the settings
	 * and initiate generation of images
	 * @param {string} dir - absolute path to file/folder of potential 3d object(s)
	 * @returns {ThreeD[]} - returns array of ThreeD instances who all had their image generated
	 */
	async generateScad (dir) {
		const files = this.getFiles(dir)
		this.sortFiles(files)
		this.trimFiles(files)

		await this.initGen(files)
		return files
	}

	/**
	 * Will stitch together the temporary images generated and create an overview based on the
	 * settings given by the end-user
	 * @param {ThreeD[]} threeds - List of ThreeD instances that all had their images generated
	 * and an output location applied to
	 * @param {string} dir - Absolute path+filename of the desired output location for the final result
	 */
	async stitch (threeds, dir) {
		const process = new Stitch(
			threeds,
			this.outputLocation(dir),
			this.conf
		)
		await process.init()
	}

	/**
	 * Starts the main process, one by one the files/folders will be scanned, generated and stitched.
	 * Also will adjust progress bars for the end-user. At a succesfull end will delete all temporary files
	 */
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

	/**
	 * Returns the name of the folder + .png appended
	 * @param  {string} dir - absolute path of the origin of the ThreeD instances
	 * @returns {string} - Returns parsed folder name, with .png appended
	 */
	outputName (dir) {
		return path.parse(dir).name + '.png'
	}

	/**
	 * Returns the outputlocation, depending if the output was set to be absolute
	 * or relative. In case of absolute will return the absolute path with appended file name.
	 * Relative path will be resolved on the set output with appeneded file name.
	 * @param  {string} dir - absolute or relative path of the outputlocation
	 */
	outputLocation (dir) {
		const confLoc = this.conf.outputLocation
		if (path.isAbsolute(confLoc)) {
			return path.join(confLoc, this.outputName(dir))
		} else {
			const parse = path.parse(dir)
			const root = (parse.ext) ? parse.dir : dir
			const folder = path.resolve(root, this.conf.outputLocation)
			return path.join(folder, this.outputName(dir))
		}
	}

	/**
	 * Will delete temporary files left by the Openscad binary
	 */
	cleanup () {
		this.scad.clearTempDir()
	}
}

module.exports = Process
