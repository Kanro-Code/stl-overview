const ThreeD = require('../threed')
const { TestScheduler } = require('jest')
const path = require('path')
const { exitCode } = require('process')

const folder = path.resolve(__dirname, './files/')

test('create threed object', () => {
	let data = new ThreeD()
	expect(data.location).toBeUndefined()
	let location = 'testing'
	data.location = location
	expect(data.location).toEqual(location)

	location = 'D:\\Desktop\\output\\threed.stl'
	let data2 = new ThreeD(location)
	expect(data2.location).toEqual(location)

	location = 'D:\\Desktop\\output\\threed-2.stl'
	data2.location = location
	expect(data2.location).toEqual(location)

	location = 'D:/Desktop/output/threed.stl'
	let data3 = new ThreeD(location)
	expect(data3.location).toEqual(location)

	location = './files/stl.stl'
	let data4 = new ThreeD(location)
	expect(data4.location).toEqual(location)
})

test('get size object', () => {
	let data = new ThreeD()
	expect(() => { data.size }).toThrow()

	let data2 = new ThreeD()
	data2.location = path.join(folder, 'benchy-part-1.stl')
	expect(data2.size).toEqual(18284)
	data2.location = path.join(folder, 'benchy-part-2.stl')
	expect(data2.size).toEqual(35484)
})


test('get child instance', () => {
	let location = path.join(folder, 'benchy-part-1.stl')
	let obj = ThreeD.getChildInstance(location)
	expect(obj.location).toEqual(location)

	location = path.join(folder, './sub/fake.stl')
	obj = ThreeD.getChildInstance(location)
	expect(obj.location).toEqual(location)

	location = path.join(folder, 'fakefile.txt')
	obj = ThreeD.getChildInstance(location)
	expect(obj).toBeUndefined()

	location = path.join(folder, './sub/fake.obj')
	obj = ThreeD.getChildInstance(location)
	expect(obj).toBeUndefined()
})

test('get objects in folders and subfolders', () => {
	let objs = ThreeD.getObjsFolder(folder, false)
	expect(objs.length).toBe(2)

	objs = ThreeD.getObjsFolder(folder, true)
	expect(objs.length).toBe(6)

	let location = path.join(folder, 'empty')
	console.log(location)
	objs = ThreeD.getObjsFolder(location, false)
	expect(objs.length).toBe(0)

	location = path.join(folder, 'empty')
	objs = ThreeD.getObjsFolder(location, true)
	expect(objs.length).toBe(0)
})

test('get objs--, or singular stl, and check sorted', () =>{
	let location = path.join(folder, 'benchy-part-1.stl')
	let objs = ThreeD.getObjs(location)
	expect(objs.length).toBe(1)
	objs = ThreeD.getObjs(location, true)
	expect(objs.length).toBe(1)
	objs = ThreeD.getObjs(location, false)
	expect(objs.length).toBe(1)
	objs = ThreeD.getObjs(location, null, 'size')
	expect(objs.length).toBe(1)
	objs = ThreeD.getObjs(location, null, 'random')
	expect(objs.length).toBe(1)
	objs = ThreeD.getObjs(location, null, 'falseOption')
	expect(objs.length).toBe(1)

	location = path.join(folder, './sub/fakefile.txt')
	objs = ThreeD.getObjs(location)
	expect(objs.length).toBeFalsy()
	objs = ThreeD.getObjs(location, true)
	expect(objs.length).toBeFalsy()
	objs = ThreeD.getObjs(location, false)
	expect(objs.length).toBeFalsy()
	objs = ThreeD.getObjs(location, null, 'size')
	expect(objs.length).toBeFalsy()
	objs = ThreeD.getObjs(location, null, 'random')
	expect(objs.length).toBeFalsy()
	objs = ThreeD.getObjs(location, null, 'falseOption')
	expect(objs.length).toBeFalsy()

	location = folder
	objs = ThreeD.getObjs(location)
	expect(objs.length).toBe(6)
	objs = ThreeD.getObjs(location, true)
	expect(objs.length).toBe(6)
	objs = ThreeD.getObjs(location, false)
	expect(objs.length).toBe(2)


	objs = ThreeD.getObjs(location, null, 'size')
	expect(objs[0].size).toBeGreaterThanOrEqual(objs[1].size)
	objs = ThreeD.getObjs(location, null, 'falseOption')
	expect(objs.length).toBe(2)
	// Can't check for randomness
	// objs = ThreeD.getObjs(location, null, 'random')
	// expect(objs.length).toBeFalsy()
})

test('setter/getter location', () => {
	const location1 = '/test/test/test/test.obj'
	const location2 = './relativetest/threed.stl'

	const data = new ThreeD()
	expect(data.location).toBeUndefined()
	data.location = location1
	expect(data.location).toBe(location1)
	data.location = location2
	expect(data.location).toBe(location2)
})

test('if generate image return a promise', () => {
	let data = new ThreeD('./files/benchy-part-1.stl')
	let promise = data.generateImage('output.png', )
})