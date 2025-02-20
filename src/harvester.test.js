const { JSDOM } = require('jsdom')
const harvest = require('./harvester')

function testHarvester(tpl, html, query) {
  const dom = new JSDOM(html)
  return harvest(tpl, dom.window.document.querySelector(query))
}

describe('harvester library tests', () => {
  let consoleSpy
  beforeEach(() => consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {}))
  afterEach(() => consoleSpy.mockRestore())

  it('test if there is no pseudo template', () => {
    const ret = testHarvester('', `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
    </body>
    </html>
    `, 'body')
    expect(ret[0]).toEqual({})
    expect(ret[1]).toEqual(0)
    expect(ret[2]).toEqual(0)
  })
  it('test if there is no DOM tree', () => {
    const ret = harvest('div', null)
    expect(ret[0]).toEqual({})
    expect(ret[1]).toEqual(1)
    expect(ret[2]).toEqual(0)
  })
  it('test if there is no DOM tree and pseudo template', () => {
    const ret = harvest('', null)
    expect(ret[0]).toEqual({})
    expect(ret[1]).toEqual(0)
    expect(ret[2]).toEqual(0)
  })
  it('test for an empty template and wrong start padding', () => {
    const ret = testHarvester(`
     div
      span
        h1`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>
        <span>
          <h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).toHaveBeenCalledWith("Error in line '     div' #:1. Wrong left indention. Must be a multiple of 2.")
    expect(ret[0]).toEqual({})
  })
  it('test for an empty template and correct start padding', () => {
    const ret = testHarvester(`
    div
      span
        h1`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>
        <span>
          <h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({})
  })
})