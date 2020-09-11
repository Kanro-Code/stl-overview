const path = require('path');
const fs = require('fs');
const child = require('child_process');
const os = require('os');

class Openscad {
	constructor(exe, flags) {
		this.exe = exe;

		let defFlags = {
			autocenter: true,
			viewall: true,
			fullrender: true,
			ortho: true,
			colorscheme: 'Cornfield',
		};

		this.flags = {...defFlags, ...flags};
	};

	validateExe() {
		// Shell command to test if openscad reacts, not without fault, but good enough
		let output = child.spawnSync(this.exe, ['--info']);
		return (output.status === 0 ) ? dir : false;
	};

	prepareFlags(impFile, output, settings) {
		let flags = [
			`-o${output}`,
			`--imgsize=${settings.w},${settings.h}`,
			`--colorscheme=${this.flags.colorscheme}`,
			impFile
		];

		if (this.flags.autocenter) 
			flags.push('--autocenter');
		if (this.flags.viewall) 
			flags.push('--viewall');
		if (this.flags.fullrender) 
			flags.push('--render');
		if (this.flags.ortho) 
		 	flags.push('--projection=o');

		return flags;
	}

	static randomUnique() {
		let number = Math.random();
		number.toString(36);
		return number.toString(36).substr(2);
	}

	createImport(origin) {
		let impFile = path.join(this.tempDir, Openscad.randomUnique());

		// Create important command, making sure path is posix compatible 
		// --> posix needed due to openscad weirdness
		origin = origin.split(path.sep).join(path.posix.sep);

		let importCommand = `import(\"${origin}\", convexity=10 )\;`;
		fs.writeFileSync(impFile, importCommand);

		return impFile;
	}

	async generateImage(output = false, threed, settings) {
		return new Promise((resolve, reject) => {
			if (!output) {
				output = path.join(this.tempDir, Openscad.randomUnique() + '.png');
			}

			let location = threed.location;
			let impFile = this.createImport(location);
			let flags = this.prepareFlags(impFile, output, settings);

			let thread = child.spawn(this.exe, flags);
			thread.on('close', (code) => {
				if (code === 0) {
					resolve(output);
				} else {
					reject(`child process exited with error code ${code} - openscad settings were wrong`);
				}
			});
		})
	}

	set exe(exe) {
		if (!exe) throw ('no exe passed');

		//Change .app to link to internal exe - OSX
		if (process.platform === 'darwin')
			exe = path.join(exe, 'Contents/MacOS/Openscad');
		this._exe = exe;
	};

	get exe() {
		return this._exe;
	}

	get tempDir() {
		if (this._tempDir) return this._tempDir;

		const tmpDir = path.join(os.tmpdir());
		this._tempDir = fs.mkdtempSync(`${tmpDir}${path.sep}`);

		return this._tempDir;
	}
}




// 	async generateImage(file) {
// 		return new Promise((resolve, reject) => {
// 			let id = this.key++;
// 			let output = path.parse(file).name + '-' + id + '.png';

// 			// Create importfile with unique id
// 			let importFile = this.createImportFile(id, file);

// 			// Prepare shell flags and execute command
// 			let flags = this.prepareFlags(output, importFile, id);

// 			// Execute openscad call
// 			try {
// 				console.log("Generating: " + path.parse(file).base);
// 				let thread = child.spawn(this.conf.scadExe, flags, { cwd: this.conf.scadOutputDir });

// 				thread.on('close', (code) => {
// 					if (code !== 0) {
// 						reject(`child process exited with error code ${code} - openscad settings were wrong`);
// 					} else {
// 						resolve(path.join(this.conf.scadOutputDir, output));
// 						this.deleteImportFile(importFile);
// 					}
// 				});
// 			} catch(err) {
// 				reject(err);
// 			}

// 			// Wait for close event to resolve and delete import file

// 		})
// 	}

// 	prepareFlags(output, importFile, id) {
// 		importFile = path.parse(importFile).base;
// 		let flags = [
// 			'-o' + output,
// 			`--imgsize=${this.conf.imgW},${this.conf.imgH}`,
// 			`--colorscheme=${this.conf.imgColorscheme}`
// 		];


// 		if (this.conf.imgAutoCenter) flags.push('--autocenter');
// 		if (this.conf.imgViewAll) flags.push('--viewall');
// 		if (this.conf.imgFullRender) flags.push('--render');
// 		if (this.conf.imgOrtho) flags.push('--projection=o');

// 		flags.push(importFile);

// 		return flags;
// 	}

// 	createImportFile(id, file) {
// 		let importFile = path.join(this.conf.scadOutputDir, '__temp' + id);
// 		let importCommand = 'import(\"' + file.split(path.sep).join(path.posix.sep) + '\", convexity=10 )\;';
// 		fs.writeFileSync(importFile, importCommand);

// 		return importFile;
// 	}

// 	deleteImportFile(importFile) {
// 		fs.unlinkSync(importFile);
// 	}
// }
module.exports = Openscad;