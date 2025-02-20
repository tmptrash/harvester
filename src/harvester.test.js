const { JSDOM } = require('jsdom')
const harvest = require('./harvester')

describe('harvester library tests', () => {
  it('test if there is no pseudo template', () => {
    const dom = new JSDOM(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
    </body>
    </html>
    `)
    const ret = harvest('', dom.window.document.querySelector('body'))
    expect(ret[0]).toEqual({})
    expect(ret[1]).toEqual(0)
    expect(ret[2]).toEqual(0)
  })
  it('test for an empty template and wrong start padding', () => {
    const dom = new JSDOM(`
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
    `)
    const tpl = `
     div
      span
        h1`
    const doc = dom.window.document
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const [map] = harvest(tpl, doc.querySelector('body > div'))
    expect(consoleSpy).toHaveBeenCalledWith("Error in line '     div' #:1. Wrong left indention. Must be a multiple of 2.")
    expect(map).toEqual({})
    consoleSpy.mockRestore();
  })
  it('test for an empty template and correct start padding', () => {
    const dom = new JSDOM(`
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
    `)
    const tpl = `
    div
      span
        h1`
    const doc = dom.window.document
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const [map] = harvest(tpl, doc.querySelector('body > div'))
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(map).toEqual({})
    consoleSpy.mockRestore();
  })
})