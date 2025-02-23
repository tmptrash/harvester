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
    expect(consoleSpy).toHaveBeenCalledWith("Error in line '     div' #:1. Wrong left indentation. Must be a multiple of 2.")
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
    expect(ret[1]).toEqual(3)    
    expect(ret[2]).toEqual(3)
  })
  it('test of pseudo tree template with 1 text tag', () => {
    const ret = testHarvester(`
    div{text}
      span
        h1`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>Text
        <span>
          <h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({text: 'Text'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(4)
  })
  it('test of pseudo tree template with 1 text tag (2)', () => {
    const ret = testHarvester(`
    div
      span{text}
        h1`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>
        <span>Text
          <h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({text: 'Text'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(4)
  })
  it('test of pseudo tree template with 1 text tag (3)', () => {
    const ret = testHarvester(`
    div
      span
        h1{text}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>
        <span>
          <h1>Text</h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({text: 'Text'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(4)
  })
  it('test of pseudo tree template with 2 text tags (2 & 3)', () => {
    const ret = testHarvester(`
    div
      span{text}
        h1{h1}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>
        <span>Text
          <h1>H1</h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({text: 'Text', h1: 'H1'})
    expect(ret[1]).toEqual(5)
    expect(ret[2]).toEqual(5)
  })
  it('test of pseudo tree template with 2 text tags (1 & 3)', () => {
    const ret = testHarvester(`
    div{text}
      span
        h1{h1}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>Text
        <span>
          <h1>H1</h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({text: 'Text', h1: 'H1'})
    expect(ret[1]).toEqual(5)
    expect(ret[2]).toEqual(5)
  })
  it('test of pseudo tree template with 2 text tags (1 & 2)', () => {
    const ret = testHarvester(`
    div{text}
      span{span}
        h1`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>Text
        <span>SPAN
          <h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({text: 'Text', span: 'SPAN'})
    expect(ret[1]).toEqual(5)
    expect(ret[2]).toEqual(5)
  })
  it('test of pseudo tree template with 3 text tags', () => {
    const ret = testHarvester(`
    div{div}
      span{text}
        h1{h1}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>DIV
        <span>Text
          <h1>H1</h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({text: 'Text', h1: 'H1', div: 'DIV'})
    expect(ret[1]).toEqual(6)
    expect(ret[2]).toEqual(6)
  })
  it('test of pseudo tree template with 1 attr tag (1)', () => {
    const ret = testHarvester(`
    div[img=href]
      span
        h1`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div href="test">
        <span>
          <h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({img: 'test'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(4)
  })
  it('test of pseudo tree template with 1 attr tag (2)', () => {
    const ret = testHarvester(`
    div
      span[attr=src]
        h1`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>
        <span src="test">
          <h1>
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({attr: 'test'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(4)
  })
  it('test of pseudo tree template with 1 attr tag (3)', () => {
    const ret = testHarvester(`
    div
      span
        h1[h2=h3]`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>
        <span>
          <h1 h3="h4">
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({h2: 'h4'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(4)
  })
  it('test of pseudo tree template with 1 text tag and 1 attr tag', () => {
    const ret = testHarvester(`
    div{div}
      span
        h1[src=href]`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <div>DIV
        <span>
          <h1 href="http">
        </span>
      </div>
    </body>
    </html>
    `, 'body > div')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({div: 'DIV', src: 'http'})
    expect(ret[1]).toEqual(5)
    expect(ret[2]).toEqual(5)
  })
  it('test of pseudo tree template which is partly equal to DOM tree (1)', () => {
    const ret = testHarvester(`
    div
      span
        h1{h1}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <section>
        <span>
          <h1>H1</h1>
        </span>
      </section>
    </body>
    </html>
    `, 'body > section')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({h1: 'H1'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(3)
  })
  it('test of pseudo tree template which is partly equal to DOM tree (2)', () => {
    const ret = testHarvester(`
    div
      span
        h1{h1}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <section>
        <div>
          <h1>H1</h1>
        </div>
      </section>
    </body>
    </html>
    `, 'body > section')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({h1: 'H1'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(2)
  })
  it('test of pseudo tree template which is partly equal to DOM tree (3)', () => {
    const ret = testHarvester(`
    div
      span
        h1{h1}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <section>
        <div>
          <h1>
          <h1>H1</h1>
        </div>
      </section>
    </body>
    </html>
    `, 'body > section')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({h1: 'H1'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(2)
  })
  it('test of pseudo tree template which is partly equal to DOM tree (4)', () => {
    const ret = testHarvester(`
    div
      span
        h1{h1}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <section>
        <div>
          <div>
            <h1>
            <h1>H1</h1>
          </div>
        </div>
      </section>
    </body>
    </html>
    `, 'body > section')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({h1: 'H1'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(2)
  })
  it('test of pseudo tree template which is partly equal to DOM tree (5)', () => {
    const ret = testHarvester(`
    div
      span
        h1{h1}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
      <section>
        <span>
          <div>
            <h1>
            <h1>H1</h1>
          </div>
        </span>
      </section>
    </body>
    </html>
    `, 'body > section')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({h1: 'H1'})
    expect(ret[1]).toEqual(4)
    expect(ret[2]).toEqual(2)
  })
  it('test of pseudo tree template which is partly equal to DOM tree (6)', () => {
    const ret = testHarvester(`
    div
      h1{h1}
      h1{h2}`, `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
    </head>
    <body>
    <section>
      <h1>H1</h1>
      <h1>
        <div></div>H2
      </h1>
    </section>
  </body>
    </html>
    `, 'body > section > h1')
    expect(consoleSpy).not.toHaveBeenCalled()
    expect(ret[0]).toEqual({h1: 'H1', h2: 'H2'})
    expect(ret[1]).toEqual(5)
    expect(ret[2]).toEqual(3)
  })
})