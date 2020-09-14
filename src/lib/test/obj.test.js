const Obj = require('../threed-obj');
const ThreeD = require('../threed');

test('create object', () => {
  let data = new Obj();

  expect(data.location).toBeUndefined();
  expect(() => {
    data.size
  }).toThrow();
});

test('create object and see if it has correct parent', () => {
  let data = new Obj();
  let parent = new ThreeD();
  let check = Object.getPrototypeOf(Object.getPrototypeOf(data));
  expect(check)
    .toEqual(Object.getPrototypeOf(parent));
});

// test.each([
  // ['test.obj', true],
  // ['.obj', false],
  // ['./easdsd/asds/sdsd.obj', true],
  // ['./easdsd/.asds/.obj.stl', false],
  // ['', false],
  // ['.stl', false],
  // ['test.stl', false],
  // ['test.obj.stl', false]
// ])('%s is valid obj', (a, expected) => {
  // expect(Obj.isObj(a)).toBe(expected);
// });
