const { dialog, shell, app } = require('electron').remote

const ThreeD = require('../lib/threed')
const Openscad = require('../lib/openscad')
const Process = require('./process')
const fs = require('fs')
const path = require('path')
const { removeListener } = require('cluster')

const saveLocation = path.join(app.getPath('appData'), 'stl-overview', 'previous-session.json')

const currentFiles = []

const removeDirClick = (e) => {
  console.log(e)
  const item = e.srcElement.parentNode
  removeDir(item.value)
  const p = item.parentNode.parentNode
  p.parentNode.removeChild(p)
}

const clearAllButton = () => {
  const b = document.querySelector('#drop-clear')
  if (currentFiles.length === 0) {
    b.classList.add('hidden')
  } else {
    b.classList.remove('hidden')
  }
}

const prepClearAll = () => {
  document.querySelector('#drop-clear').addEventListener('click', () => {
    const buttons = document.querySelectorAll('.remDir')
    console.log(buttons)
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].click()
    }
  })
  clearAllButton()
}

const removeDir = (dir) => {
  for (var i = currentFiles.length - 1; i >= 0; i--) {
    if (currentFiles[i] === dir) {
      currentFiles.splice(i, 1)
      break
    }
  }

  clearAllButton()
}

const sizeDenom = (number) => {
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

  if (objs.length === 0) {
    // customError(`Adding file resulted in an error. Most likely this is due to not containing a valid and supported file type. <br> &nbsp; Path: "${dir}"`, 1)
    removeDir(dir)
    meta.innerHTML = '<p class="f-meta" style="color:red">Could not find valid files, will not process</p>'
  } else {
    for (let i = 0; i < objs.length; i++) {
      size += objs[i].size
    }
    meta.innerHTML = `${objs.length} items found - ${sizeDenom(size)}`
  }
}

const newDir = (dir) => {
  const list = document.querySelector('.f-list')

  // append to list
  const listItem = document.createElement('listItem')
  listItem.classList.add('list-group-item')
  listItem.innerHTML = `<span class="float-right f-delete">
    <button type="button" class="close" onclick="removeDirClick(event)" value="${dir}"><span aria-hidden="true" class="remDir">&times;</span></button>
    </span>
    <p class="path">${dir}</p>
    <p class="f-meta">...</p>`

  //   <button type="button" class="close" aria-label="Close">
  //   <span aria-hidden="true">&times;</span>
  // </button>
  list.appendChild(listItem)
  appendMeta(listItem, dir)
  clearAllButton()
}

const checkDirs = (dirs) => {
  if (!dirs) return false

  dirs.forEach(dir => {
    if (!currentFiles.includes(dir)) {
      currentFiles.push(dir)
      newDir(dir)
    };
  })
}

const prepDrop = () => {
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
    const options = {
      title: 'Select file(s)',
      buttonLabel: 'Select',
      properties: [
        'multiSelections',
        'openFile',
        'dontAddToRecent',
        'createDirectory',
        'promptToCreate'
      ],
      filters: [
        { name: 'Custom File Type', extensions: ['stl'] },
        { name: 'All Files', extensions: ['*'] }]
    }
    const output = dialog.showOpenDialogSync(null, options)
    checkDirs(output)
  })

  document.querySelector('#drop-folder').addEventListener('click', () => {
    const options = {
      title: 'Select folder(s)',
      buttonLabel: 'Select',
      properties: [
        'multiSelections',
        'openDirectory',
        'dontAddToRecent',
        'createDirectory',
        'promptToCreate'
      ]
    }
    const output = dialog.showOpenDialogSync(null, options)
    checkDirs(output)
  })
}

const validateExe = (exe) => {
  const scad = new Openscad(exe)

  var label = document.querySelector('#openscad-exe')
  label.value = exe

  if (scad.validateExe()) {
    label.classList.add('is-valid')
    label.classList.remove('is-invalid')
  } else {
    label.classList.add('is-invalid')
    label.classList.remove('is-valid')
  }
}

const prepOpenscad = () => {
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
    validateExe(output[0])
  })
}

const prepColor = () => {
  document.querySelector('#colorschemeselect')
    .addEventListener('change', (e) => {
      const image = document.querySelector('#colorschemepreview')
      image.src = 'img/colorscheme/' + e.srcElement.value + '.png'
    })
}

const prepOutput = () => {
  document
    .querySelector('#outputLocationBrowse')
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
    .querySelector('#outputLocationRelative')
    .addEventListener('input', (e) => {
      document.querySelector('#outputLoc1').checked = true
    })

  document
    .querySelector('#outputLocationAbsolute')
    .addEventListener('input', e => {
      document.querySelector('#outputLoc2').checked = true
    })
}

const pullValueId = (id) => {
  return document.querySelector('#' + id).value
}

const pullValueRadio = (name) => {
  var el = document.getElementsByName(name)

  for (var i = 0, length = el.length; i < length; i++) {
    if (el[i].checked) return el[i].value
  }
}

const pullValueCheck = (id) => {
  return document.querySelector('#' + id).checked
}

const pullSettings = () => {
  const conf = {
    scadExe: pullValueId('openscad-exe'),
    autocenter: pullValueCheck('imgAutoCenter'),
    viewall: pullValueCheck('imgViewAll'),
    fullrender: pullValueCheck('imgsFullRender'),
    ortho: pullValueRadio('perspective') === 'ortho',
    colorscheme: pullValueId('colorschemeselect'),
    recur: pullValueCheck('recursive'),
    imgsMax: parseInt(pullValueId('imgsMax')),
    imgsSortedBy: pullValueRadio('orderBy'),
    outputW: parseInt(pullValueId('outputW')),
    columns: parseInt(pullValueId('stitchColumns')),
    createSinglePreview: pullValueCheck('imgsKeepPreview'),
    maxProcess: parseInt(pullValueId('maxProcess')),
    absolute: pullValueId('outputLocationAbsolute'),
    relative: pullValueId('outputLocationRelative'),
    outputLoc1: document.querySelector('#outputLoc1').checked,
    outputLoc2: document.querySelector('#outputLoc2').checked,
    metaEnabled: pullValueId('metaEnabled')
  }

  if (pullValueRadio('outputLocation') === 'outputRelative') {
    conf.process.outputLocation = pullValueId('outputLocationRelative')
    // conf.process.scadOutputAbsolute = false
  } else {
    conf.process.outputLocation = pullValueId('outputLocationAbsolute')
    // conf.process.scadOutputAbsolute = true
  }

  return conf
}

class ProgressBar {
  constructor (id) {
    this.el = document.querySelector(id)
    this.elMeta = this.el.parentElement.parentElement.querySelector('.meta')
  }

  async setup (min, max, current) {
    this.min = min
    this.max = max
    this.current = current
    this.el.classList.remove('bg-success')
    this.update()
  }

  async update () {
    let per = this.current / this.max * 100
    per = (per > 50) ? Math.ceil(per) : Math.floor(per)

    this.el.style.width = `${per}%`
    this.el.innerHTML = `${this.current}\\${this.max}`
  }

  async add (addition = 1) {
    if (this.current < this.max) {
      this.current += addition
    }

    this.update()
  }

  async finish () {
    this.el.classList.add('bg-success')
    this.current = this.max
    this.meta = 'Current: Done'
    this.update()
  }
}

const start = async (e) => {
  const button = e.srcElement
  console.log(button)
  // if (currentFiles.length === 0) {
  //   window.alert('Select files/folders before starting')
  //   return
  // }
  const conf = pullSettings()
  saveSettings(conf)

  const bars = [
    new ProgressBar('#bar1'),
    new ProgressBar('#bar2'),
    new ProgressBar('#bar3')
  ]

  button.innerHTML = 'In Progress...'
  button.classList.add('disabled')
  const process = new Process(conf, currentFiles, bars)

  await process.start()
  console.log('hit')
  button.innerHTML = 'Generate Images'
  button.classList.remove('disabled')
}

const prepareModal = () => {
  const modal = document.querySelector('.modal')
  const body = document.querySelector('body')

  document.querySelector('.modal-close').addEventListener('click', (e) => {
    modal.classList.add('hidden')
    body.classList.remove('modal-open')
    document.querySelector('.modal-body').innerHTML = null
    document.querySelector('.modal-title').innerHTML = null
  })
}

const loadPreviousSettings = () => {
  if (fs.existsSync(saveLocation)) {
    let settings = fs.readFileSync(saveLocation)
    settings = JSON.parse(settings)

    if (settings.scadExe) {
      document.querySelector('#openscad-exe').value = settings.scadExe
      validateExe(settings.scadExe)
    }
    if (settings.misc.absolute) {
      document.querySelector('#outputLocationAbsolute').value = settings.misc.absolute
    }
    if (settings.misc.relative) {
      document.querySelector('#outputLocationRelative').value = settings.misc.relative
    }
    if (settings.misc.outputLoc1) {
      document.querySelector('#outputLoc1').checked = true
    }
    if (settings.misc.outputLoc2) {
      document.querySelector('#outputLoc2').checked = true
    }
  }
}

const saveSettings = (conf) => {
  const json = JSON.stringify(conf)
  fs.writeFile(saveLocation, json, (err) => {
    if (err) throw err
  })
}

const ready = () => {
  prepDrop()
  prepOpenscad()
  prepColor()
  prepOutput()
  prepareModal()
  loadPreviousSettings()
  prepClearAll()
}

const customError = (e, url, line) => {
  console.log(e, url, line)
  console.log(e.stack)
  // Check if error is already in progress, if so, append to current box
  const modal = document.querySelector('.modal')
  document.querySelector('.modal-title').innerHTML = 'Unexpected error has occured'
  const modalBody = document.querySelector('.modal-body')
  const alert = `<div class="alert alert-danger" role="alert">${e}<br>${url}<br>${line}</div>`
  modalBody.innerHTML = modalBody.innerHTML + alert

  document.querySelector('body').classList.add('modal-open')
  modal.classList.remove('hidden')
}

document.addEventListener('DOMContentLoaded', ready)

window.onerror = (e, url, line) => {
  customError(e, url, line)
}