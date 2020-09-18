const Stl = require('../threed-stl')
const ThreeD = require('../threed')

test('create object', () => {
  let data = new Stl()

  expect(data.location).toBeUndefined()
  expect(() => {
    data.size
  }).toThrow()
})

test('create object and see if it has correct parent', () => {
  let data = new Stl()
  let parent = new ThreeD()
  let check = Object.getPrototypeOf(Object.getPrototypeOf(data))
  expect(check)
    .toEqual(Object.getPrototypeOf(parent))
})


test.each([
  ['test.STL', true],
  ['test.stl', true],
  ['.stl', false],
  ['./easdsd/asds/sdsd.stl', true],
  ['./easdsd/.asds/.stl.obj', false],
  ['', false],
  ['.obj', false],
  ['test.obj', false],
  ['test.stl.obj', false]
])('%s is valid stl', (a, expected) => {
  expect(Stl.isStl(a)).toBe(expected)
})
