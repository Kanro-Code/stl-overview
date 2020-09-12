const { dialog, shell } = require('electron').remote

const ThreeD = require('../lib/threed')
const Openscad = require('../lib/openscad')
const Process = require('./process')

const currentFiles = []

const dialogOptions = {
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

const removeDir = function (item, dir) {
  var index = currentFiles.indexOf(dir)
  currentFiles.splice(index, 1)
  item.parentNode.removeChild(item)
}

const sizeDenom = function (number) {
  const denom = ['kB', 'MB', 'GB']
  for (let index = 0; index < 4; index++) {
    number = number / 1024
    if (number < 1024) {
      return number.toFixed(1) + denom[index]
    }
  }
}

const appendMeta = async function (listItem, dir) {
  const objs = ThreeD.getObjs(dir)
  const meta = listItem.querySelector('.f-meta')
  let size = 0

  if (!objs) {
    alert(`Adding file resulted in an error. Most likely this is due to not containing a valid and supported file type. \n File: "${dir}"`)
    removeDir(listItem, dir)
    return
  }

  for (let i = 0; i < objs.length; i++) {
    size += objs[i].size
  }
  console.log(meta)
  meta.innerHTML = `${objs.length} items found - ${sizeDenom(size)}`
}

const newDir = function (dir) {
  const list = document.querySelector('.f-list')

  // append to list
  const listItem = document.createElement('listItem')
  listItem.classList.add('list-group-item')
  listItem.innerHTML = `<span class="float-right f-delete">
    <button type="button" onclick="removeDir(this.parentNode.parentNode, '${dir}')" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    </span>
    <p class="path">${dir}</p>
    <p class="f-meta">...</p>`

  //   <button type="button" class="close" aria-label="Close">
  //   <span aria-hidden="true">&times;</span>
  // </button>
  list.appendChild(listItem)
  appendMeta(listItem, dir)
}

const checkDirs = function (dirs) {
  if (!dirs) return false

  dirs.forEach(dir => {
    if (!currentFiles.includes(dir)) {
      currentFiles.push(dir)
      newDir(dir)
    };
  })
}

const prepDrop = function () {
  const dropzone = document.querySelector('#drag')

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    dropzone.classList.remove('dragging')

    for (const f of e.dataTransfer.files) {
      checkDirs([f.path])
    }
  })

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })

  dropzone.addEventListener('dragenter', (event) => {
    dropzone.classList.add('dragging')
  })

  dropzone.addEventListener('dragleave', (event) => {
    dropzone.classList.remove('dragging')
  })

  document.querySelector('#drop-file').addEventListener('click', () => {
    const options = { ...dialogOptions }
    options.properties.push('openFile')
    const output = dialog.showOpenDialogSync(null, dialogOptions)
    checkDirs(output)
  })

  document.querySelector('#drop-folder').addEventListener('click', () => {
    const options = { ...dialogOptions }
    options.properties.push('openDirectory')
    const output = dialog.showOpenDialogSync(null, dialogOptions)
    checkDirs(output)
  })
}

const prepOpenscad = function () {
  // Add link to openscad website
  document.querySelector('#openscad').addEventListener('click', () => {
    shell.openExternal('https://www.openscad.org/downloads.html')
  })

  document.querySelector('#selectOpenscad').addEventListener('click', (e) => {
    const output = dialog.showOpenDialogSync(null, {
      title: 'Find the Openscad exe/app/package',
      buttonLabel: 'Select',
      properties: ['openFile']
    })

    if (!output) return

    var label = document.querySelector('#openscad-exe')
    label.value = output

    const scad = new Openscad(output[0])

    if (scad.validateExe()) {
      label.classList.add('is-valid')
      label.classList.remove('is-invalid')
    } else {
      label.classList.add('is-invalid')
      label.classList.remove('is-valid')
    }
  })
}

const prepColor = function () {
  const image = document.querySelector('#colorschemepreview')
  image.src = 'img/colorscheme/Cornfield.png'
  document.querySelector('#colorschemeselect')
    .addEventListener('change', (e) => {
      const image = document.querySelector('#colorschemepreview')
      image.src = 'img/colorscheme/' + e.srcElement.value + '.png'
      console.log(image.src)
    })
}

const prepOutput = function () {
  document
    .querySelector('#outputLocation')
    .addEventListener('click', (e) => {
      const options = {
        title: 'Pick a location to save your output',
        buttonLabel: 'Select',
        properties: [
          'openDirectory',
          'createDirectory',
          'promtToCreate'
        ]
      }

      const output = dialog.showOpenDialogSync(null, options)

      const text = document.querySelector('#outputLocationAbsolute')

      if (output) {
        text.value = output
        document.querySelector('#outputLoc2').checked = true
      }
    })

  // Check radio on change
  document
    .querySelector('#outputLocation')
    .addEventListener('input', (e) => {
      document.querySelector('#outputLoc1').checked = true
    })
}

const pullValueId = function (id) {
  return document.querySelector('#' + id).value
}

const pullValueRadio = function (name) {
  var el = document.getElementsByName(name)

  for (var i = 0, length = el.length; i < length; i++) {
    if (el[i].checked) return el[i].value
  }
}

const pullValueCheck = function (id) {
  return document.querySelector('#' + id).checked
}

const pullSettings = function () {
  const conf = {
    scadExe: pullValueId('openscad-exe'),
    scad: {
      autocenter: pullValueCheck('imgAutoCenter'),
      viewall: pullValueCheck('imgViewAll'),
      fullrender: pullValueCheck('imgsFullRender'),
      ortho: pullValueRadio('perspective') === 'ortho',
      colorscheme: pullValueId('colorschemeselect')
    },
    process: {
      recur: pullValueCheck('recursive'),
      imgsMax: parseInt(pullValueId('imgsMax')),
      imgsSortedBy: pullValueRadio('orderBy'),
      outputW: parseInt(pullValueId('outputW')),
      columns: parseInt(pullValueId('stitchColumns')),
      createSinglePreview: pullValueCheck('imgsKeepPreview'),
      scadMaxProcesses: pullValueId('scadMaxProcesses')
    }
  }

  if (pullValueRadio('outputLocation') === 'outputRelative') {
    conf.process.scadOutputName = pullValueId('outputRelative')
    conf.process.scadOutputAbsolute = false
  } else {
    conf.process.scadOutputName = pullValueId('outputLocationAbsolute')
    conf.process.scadOutputAbsolute = true
  }

  return conf
}

const prepProgress = function () {
  const el = document.querySelector('#progress')

  return el
}

const prepGenerate = function () {
  document.querySelector('#startGenerate')
    .addEventListener('click', () => {
      start()
    })
}

const start = function () {
  const conf = pullSettings()
  const process = new Process(conf, currentFiles, prepProgress())
  process.start()
}

const ready = function () {
  prepDrop()
  prepOpenscad()
  prepColor()
  prepOutput()
  prepGenerate()
}

document.addEventListener('DOMContentLoaded', ready)

// process.on('uncaughtException', (err) => {
//   const messageBoxOptions = {
//     type: 'error',
//     title: 'Error in Main process',
//     message: 'Something failed'
//   }
//   throw err
// })
