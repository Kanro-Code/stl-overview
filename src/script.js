const fs = require('fs');
const path = require('path');
const async = require('async');
const ThreeD = require('./lib/threed');
const Stl = require('./lib/stl');
const Openscad = require('./lib/openscad');
const Stitch = require('./lib/stitch');

// const commandLineUsage = require('command-line-usage');

// const sections = [
//   {
//     header: 'Stl Image Overview',
//     content: 'Scan through a folder filled with Stl files and generate an image of what is present.'
//   },
//   {
//     header: 'Options',
//     optionList: [
//       {
//         name: 'input',
//         typeLabel: '{underline file}',
//         description: 'The input to process.'
//       },
//       {
//         name: 'help',
//         description: 'Print this usage guide.'
//       }
//     ]
//   }
// ]
// const usage = commandLineUsage(sections);
// console.log(usage);

//Time to parse the command line arguments;
const optionDefinitions = [
	//{ name: 'help', alias: 'h', type: Number },
	{ name: 'max', alias: 'm', type: Number },
	{ name: 'random', type: Boolean },
	{ name: 'output', alias: 'o', type: String },
	{ name: 'input', alias: 'i', type: String },
	{ name: 'size', type: String },
	{ name: 'columns', alias: 'c', type: Number },
	{ name: 'singleFolder', alias: 's', type: Boolean },
	{ name: 'keepPreview', alias: 'k', type: Boolean },
	{ name: 'autoCenterOff', type: Boolean },
	{ name: 'viewAllOff', type: Boolean },
	{ name: 'ortho', type: Boolean },
	{ name: 'fullRender', type: Boolean },
	{ name: 'colorScheme', type: String },
	{ name: 'processes', alias: 'p', type: String },
	{ name: 'barPercentage', type: Number},
	{ name: 'barBackground', type: String},
	{ name: 'openscad', type: String},
];

const commandLineArgs = require('command-line-args');
const cmdConf = commandLineArgs(optionDefinitions);

let imgW = 300;
let imgH = 300;
if (cmdConf.size) {
	let size = cmdConf.size.split(",");
	imgW = size[0];
	imgH = size[1];
} 

let conf = {
	imgsMax: cmdConf.max || 0,
	imgsSortedRandom: cmdConf.random || false,
	imgsRecur: !cmdConf.singleFolder || true,
	imgsKeepPreview: cmdConf.keepPreview || false,

	imgAutoCenter: cmdConf.autoCenterOff || true,
	imgViewAll: cmdConf.viewAllOff || true,
	imgOrtho: cmdConf.ortho || false,
	imgFullRender: cmdConf.fullRender || false,
	imgColorscheme: cmdConf.colorScheme || 'Cornfield',
	imgW: imgW,
	imgH: imgH,

	scadOutputName: 'overview.png',
	scadMaxProcesses: cmdConf.processes || 8,

	stitchColumns: cmdConf.columns || 4,
	stitchBarPercentage: (cmdConf.barPercentage / 100) || 0.8,
	stitchBarTextHOffset: 2,
	stitchBarHOffset: 2,
	stitchBackground: cmdConf.barBackground || "#000000"
};

var defExeLocation = function() {
	// WIP, will find executable properly
	let val = process.platform;
	if (val == 'win32') return 'C:\\Program Files\\OpenSCAD\\openscad.exe';
	if (val == 'darwin') return '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD';

	// freebsd/openbsd/linux to follow
}

// Prepare default location exe openscad 
conf.scadExe = (cmdConf.openscad ? cmdConf.openscad : defExeLocation());

// Prepare folder/single file and place in objs list
let single = ThreeD.getChildInstance(cmdConf.input);
let objs = [];

if (single) {
	objs.push(single);
} else {
	conf.scadScanDir = cmdConf.input || process.cwd();
	objs = ThreeD.getObjsFolder(conf.scadScanDir, conf.imgsRecur);
}

// Prepare output, depending on if a file or a folder has been given
if (cmdConf.output) {
	let parse = path.parse(cmdConf.output);
	if (parse.base) {
		conf.scadOutputName = parse.base;
	}
	conf.scadOutputDir = parse.dir;
} else {
	conf.scadOutputDir = path.join(process.cwd(), 'previews');
}

// Create folders for output
fs.mkdirSync(conf.scadOutputDir, { recursive: true });

// Sort images by size 
if (conf.imgsSortedRandom) {
	objs = objs.sort((a,b) => {
		return Math.random() - 0.5;
	})
} else {
	objs = ThreeD.sortBySize(objs);
}

// Trim to maximum images
if (conf.imgsMax !== 0) {
	objs = objs.slice(0, conf.imgsMax);
}

// Create openscad instance and used it to generate images on all threed objects
let scad = new Openscad(conf);

async.eachLimit(objs, 8, (file, callback) => {
	file.generateImage(scad)
		.then(function() {
			callback();
		});
})
.then(() => {
	// Stitch all images
	console.log("Generated all images, stitching together.");
	let stitch = new Stitch(objs, conf);
	stitch.execute()
		.then((output) => {
			console.log("Done! Image can be found:", output);
			if (!conf.imgsKeepPreview) {
				objs.forEach(obj => { obj.deleteImage() });
			}
		})
}).catch(err => {
	throw err;
})




