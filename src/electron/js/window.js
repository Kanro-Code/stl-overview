const { dialog, ipcMain, shell } = require('electron').remote;

const ThreeD = require('../lib/threed');
const Stl = require('../lib/stl');
const Openscad = require('../lib/openscad');
const Stitch = require('../lib/stitch');
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

	document.querySelector("#openscad-exe").addEventListener('click', (e) => {
		let openscad = dialog.showOpenDialogSync(null, {
			title: 'Find the Openscad exe/app/package',
			buttonLabel: 'Select',
			properties: ['openFile']
		});
		var label = document.querySelector('#openscad-exe-text');
		label.innerHTML = openscad[0];

		console.log(e);
		if (Openscad.isValidExe(openscad[0])) {
			e.srcElement.classList.add('is-valid');
			e.srcElement.classList.remove('is-invalid');
		} else {
			e.srcElement.classList.add('is-invalid');
			e.srcElement.classList.remove('is-valid');
		}
	});
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
				text.value = output[0];
				document.querySelector('#outputLoc2').checked = true;
			}
	});

	// Check radio on change
	document
		.querySelector('#outputLocationRelative')
		.addEventListener('input', (e) => {
			document.querySelector('#outputLoc1').checked = true;
		})
}

let pullSettings = function() {
	let inputs = document.getElementsByTagName('input');
	for (let i = 0; i < inputs.length; i++) {
		console.log(inputs[i].value);
	}
}

let start = function() {
	console.log("Starting!");
	let settings = pullSettings();
}

let ready = function() {
	prepDrop();
	prepOpenscad();
	prepColor();
	prepOutput();
	prepStart();
}



document.addEventListener('DOMContentLoaded', ready);

