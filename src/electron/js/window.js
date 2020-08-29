const { dialog, ipcMain } = require('electron').remote;
const path = require('path');

let dialogOptions = { 
  title: 'Select folder(s) or file(s)',
  buttonLabel: 'Select', 
  properties: [
    'openFile', 
    'openDirectory', 
    'multiSelections', 
    'dontAddToRecent',
  ],
  filters: [    { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
  { name: 'Movies', extensions: ['mkv', 'avi', 'mp4'] },
  { name: 'Custom File Type', extensions: ['as'] },
  { name: 'All Files', extensions: ['*'] }]
}

let ready = function() {
  let inputClick = async function(button) {
    let output = await dialog.showOpenDialog(null, dialogOptions);

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

  document.getElementById('drag').ondragstart = (event) => {
    console.log(event);
    event.preventDefault()
    ipcRenderer.send('ondragstart', '/path/to/item')
  }

}



document.addEventListener('DOMContentLoaded', ready);

