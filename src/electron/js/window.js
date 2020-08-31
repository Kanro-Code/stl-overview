const { dialog, ipcMain } = require('electron').remote;
const path = require('path');

let currentFiles = [];

let dialogOptions = { 
	title: 'Select folder(s) or file(s)',
	buttonLabel: 'Select', 
	properties: [
		'openDirectory', 
		'multiSelections', 
		'dontAddToRecent',
		'createDirectory',
		'promptToCreate'
	],
	filters: [    
		{ name: 'Images', extensions: ['jpg', 'png', 'gif'] 
	},
	{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
	{ name: 'Custom File Type', extensions: ['as'] },
	{ name: 'All Files', extensions: ['*'] }]
}

let appendMeta = function(item, path) {
	item.innerHTML = 'hi... ' + path;
}

let newPath = function(path) {
	let list = document.querySelector('.f-list');  

	//append to list
	let li = document.createElement('li');
	li.classList.add('list-group-item');
	li.innerHTML = `<span class="float-right f-delete">
		<button type="button" class="btn btn-danger">X</button>
		</span>
		<p>${path}</p>
		<p class="f-meta">...</p>`;
	list.appendChild(li);

	setTimeout(() => {
		appendMeta(li.querySelector('.f-meta'), path);
	},2000);
}

let checkPaths = function(paths) {
	paths.forEach(path => {
		console.log(path);
		if (!currentFiles.includes(path)) {
			currentFiles.push(path);
			newPath(path);
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
			checkPaths([f.path]);
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
	
	dropzone.addEventListener('click', err => {
		let output = dialog.showOpenDialogSync(null, dialogOptions);
		checkPaths(output);
	});
}


let ready = function() {
	prepDrop();
}



document.addEventListener('DOMContentLoaded', ready);

