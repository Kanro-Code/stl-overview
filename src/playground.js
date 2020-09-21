const Openscad = require('./lib/openscad.js')
const ThreeD = require('./lib/threed.js')
const Stl = require('./lib/threed-stl')
const Stitch = require('./lib/stitch')
const path = require('path')

// let image = './electron/img/colorscheme/BeforeDawn.png'
const stl = new ThreeD('D:\\Downloads\\3d-print\\3d-print\\LEO_the_little_fishing_boat_visual_benchy\\files\\leo.stl')
const scad = new Openscad('C:\\Program Files\\OpenSCAD\\Openscad.exe')
const imgH = 800
const imgW = imgH

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
    }
  }

  await stl.generateImage(output, scad, { h: imgH, w: imgW })
  const stitch = new Stitch([stl, stl, stl, stl], stitchOutput, conf)
  stitch.init()
}

test()
