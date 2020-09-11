const { dialog, ipcMain, shell } = require('electron').remote;

const ThreeD = require('../lib/threed');
const Stl = require('../lib/stl');
const Openscad = require('../lib/openscad');
const Stitch = require('../lib/stitch');
const Process = require('./process')
const path = require('path');

let currentFiles = [];

let dialogOptions = { 
	title: 'Select folder(s) or file(s)',
	buttonLabel: 'Select', 
	properties: [
		'multiSelections', 
		'dontAddToRecent',
		'createDirectory',
		'promptToCreate'
	],
	filters: [    
	{ name: 'Custom File Type', extensions: ['stl'] },
	{ name: 'All Files', extensions: ['*'] }]
}

let removeDir = function(item, dir) {
	var index = currentFiles.indexOf(dir);
	currentFiles.splice(index, 1);
	item.parentNode.removeChild(item);
}

let sizeDenom = function(number) {
	let denom = ['kB', 'MB', 'GB'];
	for (let index = 0; index < 4; index++) {
		number = number / 1024;
		if (number < 1024) {
			return number.toFixed(1) + denom[index];
		} 
	}
}

let appendMeta = async function(listItem, dir) {
	let objs = ThreeD.getObjs(dir);
	let meta = listItem.querySelector('.f-meta');
	let size = 0;

	if (!objs) {
		alert(`Adding file resulted in an error. Most likely this is due to not containing a valid and supported file type. \n File: "${dir}"`);
		removeDir(listItem, dir);
		return;
	}

	for (let i = 0; i < objs.length; i++) {
		size += objs[i].size;
	}
	console.log(meta);
	meta.innerHTML = `${objs.length} items found - ${sizeDenom(size)}`;

}

let newDir = function(dir) {
	let list = document.querySelector('.f-list');  

	//append to list
	let listItem = document.createElement('listItem');
	listItem.classList.add('list-group-item');
	listItem.innerHTML = `<span class="float-right f-delete">
		<button type="button" onclick="removeDir(this.parentNode.parentNode, '${dir}')" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
		</span>
		<p class="path">${dir}</p>
		<p class="f-meta">...</p>`;

// 		<button type="button" class="close" aria-label="Close">
//   <span aria-hidden="true">&times;</span>
// </button>
	list.appendChild(listItem);
	appendMeta(listItem, dir);
}

let checkDirs = function(dirs) {
	if (!dirs) return false;

	dirs.forEach(dir => {
		if (!currentFiles.includes(dir)) {
			currentFiles.push(dir);
			newDir(dir);
		};
	});
}

let prepDrop = function() {
	let dropzone = document.querySelector("#drag");

	dropzone.addEventListener('drop', (e) => { 
		e.preventDefault(); 
		e.stopPropagation();
		dropzone.classList.remove('dragging');

		for (let f of e.dataTransfer.files) {
			checkDirs([f.path]);
		}
	}); 

	dropzone.addEventListener('dragover', (e) => { 
		e.preventDefault(); 
		e.stopPropagation(); 
	}); 

	dropzone.addEventListener('dragenter', (event) => {
		dropzone.classList.add('dragging'); 
	}); 

	dropzone.addEventListener('dragleave', (event) => { 
		dropzone.classList.remove('dragging');
	});
	
	document.querySelector('#drop-file').addEventListener('click', () => {
		let options = { ...dialogOptions };
		options.properties.push('openFile');
		let output = dialog.showOpenDialogSync(null, dialogOptions);
		checkDirs(output);
	});

	document.querySelector('#drop-folder').addEventListener('click', () => {
		let options = { ...dialogOptions };
		options.properties.push('openDirectory');
		let output = dialog.showOpenDialogSync(null, dialogOptions);
		checkDirs(output);
	})
	// dropzone.addEventListener('click', err => {
	// 	let output = dialog.showOpenDialogSync(null, dialogOptions);
	// 	checkDirs(output);
	// });
}

let prepOpenscad = function() {
	// Add link to openscad website
	document.querySelector("#openscad").addEventListener('click', () => {
		shell.openExternal('https://www.openscad.org/downloads.html');
	});
}

let selectOpenscad = function(e) {
	let output = dialog.showOpenDialogSync(null, {
		title: 'Find the Openscad exe/app/package',
		buttonLabel: 'Select',
		properties: ['openFile']
	});

	if (!output) return;

	var label = document.querySelector('#openscad-exe');
	label.value = output;

	if (Openscad.getValidExe(output[0])) {
		label.classList.add('is-valid');
		label.classList.remove('is-invalid');
	} else {
		label.classList.add('is-invalid');
		label.classList.remove('is-valid');
	}
}

let prepColor = function() {
	let selector = document.querySelector('#colorschemeselect');
	selector.addEventListener('change', (e) => {
		let image = document.querySelector('#colorschemepreview');
		image.src = 'img/colorscheme/' + e.srcElement.value + '.png';
		console.log(image.src);
	})
}

let prepOutput = function() {
	document
		.querySelector('#outputLocation')
		.addEventListener('click', (e) => {
			let options = {
				title: 'Pick a location to save your output',
				buttonLabel: 'Select',
				properties: [
					'openDirectory',
					'createDirectory',
					'promtToCreate',
				]
			}

			let output = dialog.showOpenDialogSync(null, options);

			let text = document.querySelector('#outputLocationAbsolute');

			if (output) {
				text.value = output;
				document.querySelector('#outputLoc2').checked = true;
			}
	});

	// Check radio on change
	document
		.querySelector('#outputLocation')
		.addEventListener('input', (e) => {
			document.querySelector('#outputLoc1').checked = true;
		})
}

let pullValueId = function(id) {
	return document.querySelector('#' + id).value;
}

let pullValueRadio = function(name) {
	var el = document.getElementsByName(name);

	for (var i = 0, length = el.length; i < length; i++) {
		if (el[i].checked) return el[i].value;
	}
}

let pullValueCheck = function(id) {
	return document.querySelector('#' + id).checked;
}

let pullSettings = function() {
	let inputs = document.getElementsByTagName('input');
	let conf = {
		// Openscad
		scadExe: pullValueId('openscad-exe'),

		// Select files
		imgsRecur: pullValueCheck('recursive'),

		// Output settings
		outputW: parseInt(pullValueId('outputW')),
		stitchColumns: parseInt(pullValueId('stitchColumns')),
		
		imgsMax: parseInt(pullValueId('imgsMax')),
		imgsSortedSize: pullValueRadio('orderBy') == 'size',
		imgColorscheme: pullValueId('colorschemeselect'),

		// advanced settings
		imgsKeepPreview: pullValueCheck('imgsKeepPreview'),
		imgAutoCenter: pullValueCheck('imgAutoCenter'),
		imgViewAll: pullValueCheck('imgViewAll'),
		imgFullRender: pullValueCheck('imgsFullRender'),
		imgOrtho: pullValueRadio('perspective') == 'ortho',
		scadMaxProcesses: pullValueId('scadMaxProcesses'),
	};

	if (pullValueRadio('outputLocation') == 'outputRelative') {
		conf.scadOutputName = pullValueId('outputRelative');
		conf.scadOutputAbsolute = false;
	} else {
		conf.scadOutputName = pullValueId('outputLocationAbsolute');
		conf.scadOutputAbsolute = true;
	}

	return conf;
}

let prepProgress = function() {
	let el = document.querySelector('#progress');

	el.addEventListener('message', (e) => {
		let text = el.querySelector('#temp');
		console.log(e);
	})

	return el;
}

let start = function() {
	let conf = pullSettings();
	let progress = document.querySelector('#progress');
	let process = new Process(conf, currentFiles, prepProgress());
	process.start();
}

let ready = function() {
	prepDrop();
	prepOpenscad();
	prepColor();
	prepOutput();
}



document.addEventListener('DOMContentLoaded', ready);

process.on("uncaughtException", (err) => {
	const messageBoxOptions = {
			 type: "error",
			 title: "Error in Main process",
			 message: "Something failed"
	 };
	 dialog.showMessageBox(messageBoxOptions);
	 throw err;
});

window.onerror = function(error, file, line) {
	alert(file + " - " + line + " - " + error.toString());
	console.log(error);
};
