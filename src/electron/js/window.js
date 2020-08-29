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
  
  currentFiles.push(path);

  //append to list

}

let newDrop = function(files) {
  console.log(files);
  for (let f of files) {
    console.log(f.path);
    f = f.path;
  }

  console.log(files);
}

let prepDrop = function() {
  let dropzone = document.querySelector("#drag");

  dropzone.addEventListener('drop', (e) => { 
    dropzone.classList.remove('dragging');
    e.preventDefault(); 
    e.stopPropagation();
    
    newDrop(e.dataTransfer.files);
  }); 

  dropzone.addEventListener('dragover', (e) => { 
    console.log('dragover');
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

