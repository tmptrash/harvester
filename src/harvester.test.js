const { JSDOM } = require('jsdom')
const harvest = require('./harvester')

describe('harvester library tests', () => {
  it('test', () => {
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
    const [map] = harvest(tpl, doc.querySelector('body > div'))
    expect(map).toEqual({})
  })
})