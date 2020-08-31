const { dialog, ipcMain } = require('electron').remote;
const path = require('path');

let currentFiles = [];

let dialogOptions = { 
  title: 'Select folder(s) or file(s)',
  buttonLabel: 'Select', 
  properties: [
    'openFile', 
    'openDirectory', 
    'multiSelections', 
    'dontAddToRecent',
  ],
  filters: [    
    { name: 'Images', extensions: ['jpg', 'png', 'gif'] 
  },
  { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
  { name: 'Custom File Type', extensions: ['as'] },
  { name: 'All Files', extensions: ['*'] }]
}

let newPath = function(path) {
  if (currentFiles.includes(path)) return;

  let list = document.querySelector('.f-list');  

  //append to list
  let li = document.createElement('li');
  li.classList.add('list-group-item');
  li.innerHTML = `<span class="float-right f-delete">
    <button type="button" class="btn btn-danger">X</button>
    </span>
    <p>${path}'</p>
    <p class="f-meta">...</p>`;
  list.appendChild(li);

  setTimeout(() => {
    li.querySelector('.f-meta').innerHTML = 'hi...' + path;
  },2000);
}

let newDrop = function(files) {
  for (let f of files) {
    if (!currentFiles.includes(f.path)) {
      currentFiles.push('f.path');
      newPath(f.path);
    }
  }
}

let prepDrop = function() {
  let dropzone = document.querySelector("#drag");

  dropzone.addEventListener('drop', (e) => { 
    e.preventDefault(); 
    e.stopPropagation();

    dropzone.classList.remove('dragging');
    
    newDrop(e.dataTransfer.files);
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
}

let ready = function() {
  prepDrop();

  // let inputClick = async function(button) {
  //   let output = await dialog.showOpenDialog(null, dialogOptions);

    // if (!output.canceled) {
    //   let label = button.target.parentNode.querySelector("label");
    //   let text;

    //   if (output.filePaths.length > 1) {
    //     text = output.filePaths.length + " Files/Folders";
    //   } else {
    //     text = path.parse(output.filePaths[0]).base;
    //   }

    //   label.innerHTML = text;

    //   return output.filePaths[0];
    // }
  

}



document.addEventListener('DOMContentLoaded', ready);

