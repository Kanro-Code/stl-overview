const Openscad = require('../openscad');
const path = require('path');
const child = require('child_process');
const fs = require('fs');
const { TestScheduler } = require('jest');

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
})

// Constructor
test('create Openscad Object and check flags', () => {
	const data = new Openscad(
		'test.exe',
		{
			a: 'flag11',
			b: 'flag22',
		}
	);

	expect(data.flags.a)
		.toEqual('flag11');
	expect(data.flags.b)
		.toEqual('flag22');
});

test('create Openscad Object and check if default values exists', () => {
	const data1 = new Openscad('test.exe');

	expect.anything(data1.flags.autocenter);
	expect.anything(data1.flags.viewall);
	expect.anything(data1.flags.fullrender);
	expect.anything(data1.flags.colorscheme);

	let toggle = !data1.flags.autocenter;

	// assign a different value to variable that has a default
	const data2 = new Openscad('test.exe', { autocenter: toggle });
	expect.anything(data2.flags.autocenter);
	expect(data2.flags.autocenter)
		.toEqual(toggle);
});

test('create Openscad Object and check exe - platform specific', () => {
	// Check conversion for OSX
	Object.defineProperty(process, 'platform', { value: 'darwin' });
	let openscad1 = require('../openscad');
	let data = new openscad1('/asda/asdd/test.app');
	let exe = data.exe.split(path.sep).join(path.posix.sep);
	expect(exe)
		.toEqual('/asda/asdd/test.app/Contents/MacOS/Openscad');
	data.exe = '/new/sub/test1.app';
	exe = data.exe.split(path.sep).join(path.posix.sep);
	expect(exe)
		.toEqual('/new/sub/test1.app/Contents/MacOS/Openscad');

	// Check conversion for Windows
	Object.defineProperty(process, 'platform', { value: 'win32' });
	let openscad2 = require('../openscad');
	data = new openscad2('\\asdaa\\assdd\\test.exe');
	expect(data.exe).toEqual('\\asdaa\\assdd\\test.exe');
	data.exe = '\\new\\sub\\test2.exe';
	expect(data.exe)
		.toEqual('\\new\\sub\\test2.exe');

	expect(() => {
		data = new Openscad();
	}).toThrow();
});

test('valid exe check if spawn is called', () => {
	let data = new Openscad('test.exe');
	expect(data.validateExe('test.exe'))
		.toBeFalsy();
})

test('get tempdir', () => {
	let data = new Openscad('test.exe');
	let dir = data.tempDir;

	expect.anything(dir);

	let stats = fs.lstatSync(dir);
	expect(stats.isDirectory())
		.toBeTruthy();
})

test('clear tempdir', () => {
	let data = new Openscad('test.exe');
	let dir = data.tempDir;

	expect.anything(dir);

	let file = path.join(dir, 'test.txt');
	let text = 'this is a test';
	expect(() => {
		fs.writeFileSync(file, text);
	}).not.toThrow();

	expect(
		fs.readFileSync(file, 'utf8'))
		.toEqual(text);

	expect(() => {
		data.clearTempDir();
	}).toBeTruthy();
})

test('get tempfile', () => {
	let data = new Openscad('test.exe')
	let temp = data.tempFile()
	expect(path.parse(temp).base.length).toBe(20)
	expect(path.parse(temp).ext).toBe('.png')

	temp = data.tempFile('.jpg')
	expect(path.parse(temp).ext).toBe('.jpg')
})

test('prepare flags', () => {
	let data = new Openscad('test.exe')
	let conf = {
		w: 950,
		h: 880
	}

	let flags = data.prepareFlags('./location/importFile', 'output.png', conf)
	let flagsExpected = [
		'-ooutput.png',
		'./location/importFile',
		'--imgsize=1900,1760'
	]

	expect(flags).toEqual(expect.arrayContaining(flagsExpected))

	let settings = {
		autocenter: true,
		viewall: true,
		fullrender: true,
		ortho: true,
		colorscheme: 'Metallic'
	}

	data = new Openscad('test.exe', settings)
	flags = data.prepareFlags(null, null, { w: 555, h: 330 })
	flagsExpected = [
		'--autocenter',
		'--viewall',
		'--render',
		'--projection=o',
		'--colorscheme=Metallic'
	]

	expect(flags).toEqual(expect.arrayContaining(flagsExpected))
})

test('get randomUnique', () => {
	for (let i = 6; i <= 32; i++) {
		for (let j = 0; j < 100; j++) {
			let number = Openscad.randomUnique(i)
			expect(number.length).toBe(i)
		}
	}

	let number = Openscad.randomUnique()
	expect(number.length).toBe(8)

	number = Openscad.randomUnique(32)
	expect(number.includes('undefined')).toBeFalsy()

})

test('get tempfile', () => {

})