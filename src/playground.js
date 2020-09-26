const Openscad = require('./lib/openscad.js')
const ThreeD = require('./lib/threed.js')
const Stl = require('./lib/threed-stl')
const fs = require('fs')
const Stitch = require('./lib/stitch')
const path = require('path')
const glob = require('glob')
const { fstat, fstatSync } = require('fs')

// let image = './electron/img/colorscheme/BeforeDawn.png'
const stl = new ThreeD('D:\\Downloads\\3d-print\\3d-print\\LEO_the_little_fishing_boat_visual_benchy\\files\\leo.stl')
const scad = new Openscad('C:\\Program Files\\OpenSCAD\\Openscad.exe', { colorscheme: 'Cornfield' })
const imgH = 300
const imgW = imgH

let stls = ThreeD.getObjs('Z:\\torrent\\stl\\[Black Scrolls Games] HHShark Man HQ')

const test = async function () {
  const output = path.join(__dirname, 'test.png')
  const stitchOutput = path.join(__dirname, 'stitch_test.png')
  const conf = {
    scad: {
      h: imgH,
      w: imgW
    },
    process: {
      columns: 4
    },
    misc: {
      metaEnabled: true
    }
  }

  for (let i = 0; i < stls.length; i++) {
    await stls[i].generateImage(null, scad, { h: imgH, w: imgW })
  }

  const stitch = new Stitch(stls, stitchOutput, conf)
  stitch.init()
}

test()

// var getDirectories = function (src, callback) {
//   glob(src + '/**/*', callback);
// }
// getDirectories('Z:\\torrent\\stl', function (err, res) {
//   if (err) {
//     console.log('Error', err)
//   } else {
//     fs.writeFileSync('D:\\Desktop\\outputsNEW\\text.txt', res.toString())
//   }
// })

// getDirectories()

// let text = fs.readFileSync('D:\\Desktop\\outputsNEW\\text.txt').toString()
// let arr = []

// for (let i = 0; i < text.length; i++) {
//   if (!arr.includes(text[i])) {
//     arr.push(text[i])
//   }
// }
// fs.writeFileSync('D:\\Desktop\\outputsNEW\\chars.txt', arr.toString())
// console.log(arr)
