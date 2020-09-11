const Openscad = require('./lib/openscad.js');
const ThreeD = require('./lib/threed.js');

let scad = new Openscad('C:\\Program Files\\OpenSCAD\\openscad.exe');
let threed = new ThreeD('D:\\Desktop\\STL Temp TEst\\Dragonlionne_FINAL.stl');
let output = 'D:\\Desktop\\STL Temp TEst\\Dragonlionne_NoBase_WHOLE.png';


settings = {
  w: 800,
  h: 800
}

let temp = async function() {
  let test = await threed.generateImage(false, scad, settings);
  console.log(test);
}

temp();