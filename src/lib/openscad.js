const path = require('path');
const fs = require('fs');
const child = require('child_process');

class Openscad {
	constructor(conf) {
		let defaultConf = {
			imgAutoCenter: true,
			imgViewAll: true,
			imgW: 400, //px
			imgH: 400, //px
			imgFullRender: false,
			imgOrtho: true,
			imgColorscheme: 'Cornfield',
		};

		//Colorschemes available: 
				//  Cornfield, Metallic, Sunset, 
        //  Starnight, BeforeDawn, Nature, DeepOcean, 
        //  Solarized, Tomorrow, Tomorrow Night
        //  Monotone

		this.conf = {...defaultConf, ...conf};
		this.conf.scadExe = path.resolve(this.conf.scadExe);

		this.key = 1;
	}

	static isValidExe(dir) {
		if (process.platform === 'darwin') {
			dir = path.join(dir, 'Contents/MacOS/Openscad');
		}

		let output = child.spawnSync(dir, ['--info']);
		if (output.status === 0) {
			return true;
		} else {
			return false;
		}
	}

	async generateImage(file) {
		return new Promise((resolve, reject) => {
			let id = this.key++;
			let output = path.parse(file).name + '-' + id + '.png';

			// Create importfile with unique id
			let importFile = this.createImportFile(id, file);

			// Prepare shell flags and execute command
			let flags = this.prepareFlags(output, importFile, id);

			// Execute openscad call
			try {
				console.log("Generating: " + path.parse(file).base);
				let thread = child.spawn(this.conf.scadExe, flags, { cwd: this.conf.scadOutputDir });

				thread.on('close', (code) => {
					if (code !== 0) {
						reject(`child process exited with error code ${code} - openscad settings were wrong`);
					} else {
						resolve(path.join(this.conf.scadOutputDir, output));
						this.deleteImportFile(importFile);
					}
				});
			} catch(err) {
				reject(err);
			}

			// Wait for close event to resolve and delete import file

		})
	}

	prepareFlags(output, importFile, id) {
		importFile = path.parse(importFile).base;
		let flags = [
			'-o' + output,
			`--imgsize=${this.conf.imgW},${this.conf.imgH}`,
			`--colorscheme=${this.conf.imgColorscheme}`
		];


		if (this.conf.imgAutoCenter) flags.push('--autocenter');
		if (this.conf.imgViewAll) flags.push('--viewall');
		if (this.conf.imgFullRender) flags.push('--render');
		if (this.conf.imgOrtho) flags.push('--projection=o');

		flags.push(importFile);

		return flags;
	}

	createImportFile(id, file) {
		let importFile = path.join(this.conf.scadOutputDir, '__temp' + id);
		let importCommand = 'import(\"' + file.split(path.sep).join(path.posix.sep) + '\", convexity=10 )\;';
		fs.writeFileSync(importFile, importCommand);

		return importFile;
	}

	deleteImportFile(importFile) {
		fs.unlinkSync(importFile);
	}
}
module.exports = Openscad;