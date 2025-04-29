/* eslint-env jest */
const { JSDOM } = require('jsdom')
const { toTree, harvest, buildOptions } = require('./index')

function testHarvester (tpl, html, query, opt = {}) {
  const dom = new JSDOM(html)
  const ret = harvest(tpl, dom.window.document.querySelector(query), opt)
  expect(ret[1] >= ret[2]).toBe(true)
  return ret
}

describe('harvester library tests', () => {
  let consoleSpy
  beforeEach(() => { consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) })
  afterEach(() => consoleSpy.mockRestore())

  describe('test toTree() function', () => {
    beforeEach(() => buildOptions())

    it('parse an empty template (1)', () => {
      const tpl = ''
      const tree = toTree(tpl)
      expect(tree).toEqual([])
    })
    it('parse an empty template (2)', () => {
      const tpl = ' '
      const tree = toTree(tpl)
      expect(tree).toEqual([])
    })
    it('parse an empty template (3)', () => {
      const tpl = `
      `
      const tree = toTree(tpl)
      expect(tree).toEqual([])
    })
    it('parse a template (1)', () => {
      const tpl = 'div'
      const tree = toTree(tpl)
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse an incorrect template (1)', () => {
      const tpl = ' div'
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template (2)', () => {
      const tpl = '   div'
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template (3)', () => {
      const tpl = '     div'
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse a correct template (1)', () => {
      const tpl = '  div'
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse a correct template (2)', () => {
      const tpl = '    div'
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse a correct template (3)', () => {
      const tpl = '    div  '
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse a correct template (4)', () => {
      const tpl = `

      div

      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse a correct template (5)', () => {
      const tpl = `
      div
      span
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }, { id: 1, tag: 'SPAN', maxScore: 0 }])
    })
    it('parse an incorrect template with bad level', () => {
      const tpl = `
        div
      span
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse an incorrect template with bad levels', () => {
      const tpl = `
          div
        span
      h1
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse a correct template with tag name (1)', () => {
      const tpl = `
        div_123
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV_123', maxScore: 0 }])
    })
    it('parse a correct template with tag name (2)', () => {
      const tpl = `
        div-123
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV-123', maxScore: 0 }])
    })
    it('parse an incorrect template with space in tag name', () => {
      const tpl = `
        div 123
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template with a wrong tag name', () => {
      const tpl = `
        div/123
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template with wrong text tag', () => {
      const tpl = `
        div {text}
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse a correct template with correct text tag', () => {
      const tpl = `
        div{text}
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, textTag: 'text' }])
    })
    it('parse an incorrect template with 2 text tags', () => {
      const tpl = `
        div{text}{test}
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse a correct template with a text tags & an attr', () => {
      const tpl = `
        div{text}[test=href]
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, textTag: 'text', attrTag: ['test', 'href'] }])
    })
    it('parse a correct template with an attr', () => {
      const tpl = `
        div[test=href]
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, attrTag: ['test', 'href'] }])
    })
    it('parse an incorrect template with only attr', () => {
      const tpl = `
        [test=href]
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template with only tag text', () => {
      const tpl = `
        {test}
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template with different levels', () => {
      const tree = toTree(`
      div
        div
      h1
    section`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, children: [{ id: 1, tag: 'DIV', maxScore: 0 }] }, { id: 2, tag: 'H1', maxScore: 0 }])
    })
    it('parse a correct template with different levels (1)', () => {
      const tree = toTree(`
      div
      div
        span`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }, { id: 1, tag: 'DIV', maxScore: 0, children: [{ id: 2, tag: 'SPAN', maxScore: 0 }] }])
    })
    it('parse a correct template with different levels (2)', () => {
      const tree = toTree(`
      div
        div
          h1`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, children: [{ id: 1, tag: 'DIV', maxScore: 0, children: [{ id: 2, tag: 'H1', maxScore: 0 }] }] }])
    })
    it('parse a correct template with different levels (3)', () => {
      const tree = toTree(`
      div
        div
      h1`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, children: [{ id: 1, tag: 'DIV', maxScore: 0 }] }, { id: 2, tag: 'H1', maxScore: 0 }])
    })
    it('parse a correct template with different levels (4)', () => {
      const tree = toTree(`
      div
        div
      h1
        table`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([
        { id: 0, tag: 'DIV', maxScore: 0, children: [{ id: 1, tag: 'DIV', maxScore: 0 }] }, { id: 2, tag: 'H1', maxScore: 0, children: [{ id: 3, tag: 'TABLE', maxScore: 0 }] }
      ])
    })
    it('parse a correct template with different levels (5)', () => {
      const tree = toTree(`
      div
        div
          h1
      table`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([
        { id: 0, tag: 'DIV', maxScore: 0, children: [{ id: 1, tag: 'DIV', maxScore: 0, children: [{ id: 2, tag: 'H1', maxScore: 0 }] }] }, { id: 3, tag: 'TABLE', maxScore: 0 }
      ])
    })
    it('parse an incorrect template with broken levels (1)', () => {
      const tree = toTree(`
      div div`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template with broken levels (2)', () => {
      const tree = toTree(`
      div
          div`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse an incorrect template with broken levels (3)', () => {
      const tree = toTree(`
      div
          div
      span`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }, { id: 1, tag: 'SPAN', maxScore: 0 }])
    })
    it('parse an incorrect template with broken levels (4)', () => {
      const tree = toTree(`
      div
    div
      span`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }, { id: 1, tag: 'SPAN', maxScore: 0 }])
    })
    it('parse an incorrect template with broken levels & with text (1)', () => {
      const tree = toTree(`
      div{l1}
    div{l2}
      span{l3}`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, textTag: 'l1' }, { id: 1, tag: 'SPAN', maxScore: 0, textTag: 'l3' }])
    })
    it('parse an incorrect template with broken levels & with text (2)', () => {
      const tree = toTree(`
      div{l1}
          div{l2}
      span{l3}`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, textTag: 'l1' }, { id: 1, tag: 'SPAN', maxScore: 0, textTag: 'l3' }])
    })
    it('parse a correct template with text (1)', () => {
      const tree = toTree(`
      div{l1}
        div{l2}
      span{l3}`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([
        { id: 0, tag: 'DIV', maxScore: 0, textTag: 'l1', children: [{ id: 1, tag: 'DIV', maxScore: 0, textTag: 'l2' }] },
        { id: 2, tag: 'SPAN', maxScore: 0, textTag: 'l3' }
      ])
    })
    it('parse a correct template with text (2)', () => {
      const tree = toTree(`
      div
        div{l2}`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0, children: [{ id: 1, tag: 'DIV', maxScore: 0, textTag: 'l2' }] }])
    })
    it('parse an incorrect template with empty text', () => {
      const tree = toTree(`
      div
        div{}`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{ id: 0, tag: 'DIV', maxScore: 0 }])
    })
    it('parse a correct template with texts & attrs', () => {
      const tree = toTree(`
      div{text}[src=href]
        h1{div}[href=src]`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([
        {
          id: 0,
          tag: 'DIV',
          maxScore: 0,
          textTag: 'text',
          attrTag: ['src', 'href'],
          children: [
            { id: 1, tag: 'H1', maxScore: 0, textTag: 'div', attrTag: ['href', 'src'] }
          ]
        }
      ])
    })
  })

  describe('test harvest() function', () => {
    beforeEach(() => buildOptions({ minDepth: 3 }))

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
      expect(ret[2]).toEqual(0)
    })
    it('test if there is no DOM tree and pseudo template', () => {
      const ret = harvest('', null)
      expect(ret[0]).toEqual({})
      expect(ret[1]).toEqual(0)
      expect(ret[2]).toEqual(0)
    })
    it('test for a template and wrong padding', () => {
      const ret = testHarvester(`
        div
      span`, `
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
      expect(consoleSpy).toHaveBeenCalledWith("Error in line '      span' #:2. Wrong left indentation level.")
      expect(ret[0]).toEqual({})
    })
    it('test for a template and wrong start padding', () => {
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
      expect(consoleSpy).toHaveBeenCalledWith("Error in line '       div' #:1. Wrong left indentation. Must be a multiple of 2.")
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
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ text: 'Text' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ text: 'Text' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ text: 'Text' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ text: 'Text', h1: 'H1' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ text: 'Text', h1: 'H1' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ text: 'Text', span: 'SPAN' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ text: 'Text', h1: 'H1', div: 'DIV' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ img: 'test' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ attr: 'test' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ h2: 'h4' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ div: 'DIV', src: 'http' })
      expect(ret[1] === ret[2]).toEqual(true)
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
      expect(ret[0]).toEqual({ h1: 'H1' })
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
      expect(ret[0]).toEqual({ h1: 'H1' })
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
      expect(ret[0]).toEqual({ h1: 'H1' })
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
      expect(ret[0]).toEqual({ h1: 'H1' })
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
      expect(ret[0]).toEqual({ h1: 'H1' })
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
      `, 'body > section')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ h1: 'H1', h2: 'H2' })
    })
    it('test complex template and the DOM (1)', () => {
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
        <span>
          <span>H0</span>
          <h1>H1</h1>
          <div></div>
          <h1>
            <div></div>
            H2
          </h1>
        </span>
      </section>
    </body>
      </html>
      `, 'body > section')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ h1: 'H1', h2: 'H2' })
    })
    it('test complex template and the DOM (2)', () => {
      const ret = testHarvester(`
      div
        span{span}
          h1{h1}
        div{div}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
      <section>
        <span>span1
          <span>span2</span>
          <h1>H1</h1>
          <div></div>
          <h1>
            <div></div>
            H2
          </h1>
        </span>
        <div>div</div>
      </section>
    </body>
      </html>
      `, 'body > section')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ span: 'span1', h1: 'H1', div: 'div' })
    })
    it('test complex template and the DOM (3)', () => {
      const ret = testHarvester(`
      div
        span{span}
          h1{h1}[attr=src]
        div{div}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <section>
          <span>span1
            <span>span2</span>
            <h1 src="test">H1</h1>
            <div></div>
            <h1>
              <div></div>
              H2
            </h1>
          </span>
          <div>div</div>
        </section>
      </body>
      </html>
      `, 'body > section')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ span: 'span1', h1: 'H1', attr: 'test', div: 'div' })
    })
    it('test complex template and the DOM (3)', () => {
      const ret = testHarvester(`
      div
        span{span}[attr=src]`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span src="src" attr="attr">span1
          </span>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ span: 'span1', attr: 'src' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with wrong text + attr format (1)', () => {
      const ret = testHarvester(`
      div
        span[attr=src]{span}
        h1{h1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span src="src" attr="attr">span1
          </span>
          <h1>H1</h1>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).toHaveBeenCalled()
      expect(ret[0]).toEqual({ h1: 'H1' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with wrong text + attr format (2)', () => {
      const ret = testHarvester(`
      div
        span[attr=src][attr=src]
        h1{h1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span src="src" attr="attr">span1
          </span>
          <h1>H1</h1>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).toHaveBeenCalled()
      expect(ret[0]).toEqual({ h1: 'H1' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with attr name & _', () => {
      const ret = testHarvester(`
      div
        span[attr_1=src]
        h1{h1_}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span src="src" attr="attr">span1
          </span>
          <h1>H1</h1>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ attr_1: 'src', h1_: 'H1' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with incorrect order on a same DOM level', () => {
      const ret = testHarvester(`
      div
        span{s0}
        h1{h1}
        span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <h1>H1</h1>
          <span src="src" attr="attr">span0</span>
          <div/>
          <h1></h1>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ h1: 'H1', s1: 'span0' })
    })
    it('test a template with deep structure (1)', () => {
      const ret = testHarvester(`
      div
        span
          ban
           err1
           err2
            norm
            norm
          ban
      span
        a[href=href]
          h1
          h1{h1}
      table`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>
            <ban>
              <norm></norm>
              <norm/>
            </ban>
            <ban/>
          </span>
        </div>
        <span>
          <a href="url">
            <span>
              <h1></h1>
              <h1>H1</h1>
              <section></section>
              <h1></h1>
            </span>
            <spun>
              <a>
                <img/>
              </a>
            </spun>
          </a>
        </span>
        <table></table>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).toHaveBeenCalled()
      expect(ret[0]).toEqual({ href: 'url', h1: 'H1' })
    })
    it('test a template with deep structure (2)', () => {
      const ret = testHarvester(`
      div
        span
          ban
            norm{n1}
            norm
          ban
      span
        a[href=href]
          h1
          h1{h1}
        spun
          a
      close`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>
            <ban>
              <norm>n1</norm>
              <norm></norm>
            </ban>
            <ban/>
          </span>
        </div>
        <span>
          <a href="url">
            <span>
              <h1></h1>
              <h1>H1</h1>
              <section/>
              <h1></h1>
            </span>
            <spun>
              <a>
                <img/>
              </a>
            </spun>
          </a>
        </span>
        <close/>
      </body>
      </html>
      `, 'body > div', { minDepth: 10 })
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ n1: 'n1', href: 'url', h1: 'H1' })
    })
    it('test a template with deep fuzzy structure (3)', () => {
      const ret = testHarvester(`
      div
        span
          ban
           err
            norm{n1}
            norm
          ban[attr=attr]
           err
         err
      span
        a[href=href]
          h1
          h1{h1}
          h1{h2}
        div{spun}
          h1
           err
      close`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>
            <ban>
              <norm>n1</norm>
              <norm></norm>
            </ban>
            <ban attr="attr"/>
          </span>
        </div>
        <span>
          <a href="url">
            <span>
              <h1></h1>
              <h1>H1</h1>
              <section></section>
              <h1>H2</h1>
            </span>
          </a>
          <div>SPUN1
            <h1 href="test">
            </h1>
          </div>
        </span>
        <close/>
      </body>
      </html>
      `, 'body')
      expect(consoleSpy).toHaveBeenCalled()
      expect(ret[0]).toEqual({ attr: 'attr', n1: 'n1', href: 'url', h1: 'H1', h2: 'H2', spun: 'SPUN1' })
    })
    it('test a template with * instead of a tag (1)', () => {
      const ret = testHarvester(`
      *
        span
          ban`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span></span>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({})
    })
    it('test a template with * instead of a tag (2)', () => {
      const ret = testHarvester(`
      *
        *
          ban`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>
            <ban></ban>
          </span>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({})
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with * instead of a tag (3)', () => {
      const ret = testHarvester(`
      *
        *
          *`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>
            <ban></ban>
          </span>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({})
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with * instead of a tag (4)', () => {
      const ret = testHarvester(`
      *
        *
          *
        div{text}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>
            <ban></ban>
          </span>
          <div>TEXT</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ text: 'TEXT' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with * instead of a tag (5)', () => {
      const ret = testHarvester(`
      *
        *
          *
        *{text}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>
            <ban></ban>
          </span>
          <div>TEXT</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ text: 'TEXT' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with * instead of a tag (6)', () => {
      const ret = testHarvester(`
      *{l0:with:L0}
        *{l1}
          *{l2}
        *{l3}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>L0
          <span>L1
            <ban>L2</ban>
          </span>
          <div>TEXT</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ l0: 'L0', l1: 'L1', l2: 'L2', l3: 'TEXT' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with * instead of a tag (7)', () => {
      const ret = testHarvester(`
      *{l0}[a0=a0]
        *{l1}[a1=a1]
          *{l2}[a2=a2]
        *{l3}[a3=a3]`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div a0="A0">L0
          <span a1="A1">L1
            <ban a2="A2">L2</ban>
          </span>
          <div a3="A3">L3</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ l0: 'L0', l1: 'L1', l2: 'L2', l3: 'L3', a0: 'A0', a1: 'A1', a2: 'A2', a3: 'A3' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template with * and wrong padding', () => {
      const ret = testHarvester(`
      *{l0}[a0=a0]
       *
        *{l1}[a1=a1]
          *{l2}[a2=a2]
        *{l3}[a3=a3]`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div a0="A0">L0
          <span a1="A1">L1
            <ban a2="A2">L2</ban>
          </span>
          <div a3="A3">L3</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).toHaveBeenCalled()
      expect(ret[0]).toEqual({ l0: 'L0', l1: 'L1', l2: 'L2', l3: 'L3', a0: 'A0', a1: 'A1', a2: 'A2', a3: 'A3' })
      expect(ret[1] === ret[2]).toEqual(true)
    })
    it('test a template tag text type (1)', () => {
      const ret = testHarvester(`
      *{num:int}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div>33.545</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ num: '123' })
    })
    it('test a template tag text type (2)', () => {
      const ret = testHarvester(`
      *{num:float}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div>33.545</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ num: '123.4' })
    })
    it('test a template tag text type (3)', () => {
      const ret = testHarvester(`
      *{num:str}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div>33.545</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ num: '123' })
    })
    it('test a template tag text type (4)', () => {
      const ret = testHarvester(`
      *{num:with:23}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123
          <span>12.4
            <ban>12.45</ban>
          </span>
          <div>33.545</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ num: '123' })
    })
    it('test a template tag text type (5)', () => {
      global.check = function check (v) { return v === '33.545' }
      const ret = testHarvester(`
      *{num:func:check}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div>33.545</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      delete global.check
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ num: '33.545' })
    })
    it('test a template tag text type (6)', () => {
      const ret = testHarvester(`
      *{num:parent:span}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div>33.545</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ num: '12.45' })
    })
    it('test a template tag text type (7)', () => {
      const ret = testHarvester(`
      *{num:parent:table}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div>33.545</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({})
      expect(ret[2]).toEqual(0)
    })
    it('test a template tag text type (6)', () => {
      const ret = testHarvester(`
      *{num:empty}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div></div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ num: '' })
    })
    it('test a template tag text type (7)', () => {
      const ret = testHarvester(`
      *{num:int}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123.12
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div>67</div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ num: '67' })
    })
    it('test a template tag text type (8)', () => {
      const ret = testHarvester(`
      *{num:int}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>123.12
          <span>123.4
            <ban>12.45</ban>
          </span>
          <div></div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({})
      expect(ret[2]).toEqual(0)
    })
    it('test for search a node mutch deeper than in a template', () => {
      const ret = testHarvester(`
        h1{h1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>
            <h1>H1</h1>
          </span>
        </div>
      </body>
      </html>
      `, 'body > div > span')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ h1: 'H1' })
    })
    it('test for search of inverted nodes structure', () => {
      const ret = testHarvester(`
        h1{h1}
          span{s0}
          span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>SPAN0</span>
          <span>SPAN1
            <h1>H1</h1>
          </span>
        </div>
      </body>
      </html>
      `, 'body > div', { minDepth: 7 })
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ h1: 'H1', s0: 'SPAN0', s1: 'SPAN1' })
    })
    it('test for search of embedded nodes structure', () => {
      const ret = testHarvester(`
        span{s0}
        span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <span>SPAN0</span>
          <span>SPAN1
            <h1>H1</h1>
          </span>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ s0: 'SPAN0', s1: 'SPAN1' })
    })
    it('test for search similar nodes (1)', () => {
      const ret = testHarvester(`
        div
          span{s0}
          span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <div>
            <span>SPAN0</span>
            <h1></h1>
            <span>SPAN1
              <span>SPAN2</span>
              <span>SPAN3</span>
            </span>
          </div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ s0: 'SPAN0', s1: 'SPAN1' })
    })
    it('test for search similar nodes (2)', () => {
      const ret = testHarvester(`
        div
          span{s0:with:SPAN2}
          span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div>
          <div>
            <span>SPAN0</span>
            <h1></h1>
            <span>SPAN1
              <span>SPAN2</span>
              <span>SPAN3</span>
            </span>
          </div>
        </div>
      </body>
      </html>
      `, 'body > div')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ s0: 'SPAN2', s1: 'SPAN3' })
    })
    it('test for small DOM tree (1)', () => {
      const ret = testHarvester(`
        div
          span{s0:with:SPAN}
          span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
      </body>
      </html>
      `, 'body')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({})
      expect(ret[2]).toEqual(0)
    })
    it('test for small DOM tree (2)', () => {
      const ret = testHarvester(`
        span{s0}
        span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <span>S0
          <span>S1</span>
          <span>S2</span>
        </span>
      </body>
      </html>
      `, 'body')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ s0: 'S1', s1: 'S2' })
    })
    it('test for small DOM tree (3)', () => {
      const ret = testHarvester(`
        span{s0}
        span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <span>S0
          <span>S1</span>
          <span>S2</span>
        </span>
        <span>S3</span>
      </body>
      </html>
      `, 'body')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ s0: 'S0', s1: 'S3' })
    })
    it('test for small DOM tree (4)', () => {
      const ret = testHarvester(`
        span{s0:with:S0}
        span{s1}`, `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <span>S0
          <span>S1</span>
          <span>S2</span>
        </span>
        <span>S3</span>
      </body>
      </html>
      `, 'body')
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(ret[0]).toEqual({ s0: 'S0', s1: 'S3' })
    })

    it('test for an empty template', () => {
      const ret = testHarvester(`
       div
         span
           h1`, `
      <html lang="en">
        <body>
          <div>
            <span>
              <h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({})
    })
    it('test for a template with 1 of 3 nodes with text', () => {
      const ret = testHarvester(`
      div{text}
        span
          h1`, `
      <html lang="en">
        <body>
          <div>DIV
            <span>
              <h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'DIV' })
    })
    it('test for a template with 1 of 3 nodes with text (1)', () => {
      const ret = testHarvester(`
      div
        span{text}
          h1`, `
      <html lang="en">
        <body>
          <div>
            <span>SPAN
              <h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'SPAN' })
    })
    it('test for a template with 1 of 3 nodes with text (2)', () => {
      const ret = testHarvester(`
      div
        span
          h1{text}`, `
      <html lang="en">
        <body>
          <div>
            <span>
              <h1>H1</h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'H1' })
    })
    it('test for a template with 1 of 3 nodes with text (3)', () => {
      const ret = testHarvester(`
      div{text}
        span
          h1`, `
      <html lang="en">
        <body>
          <div>DIV
            <span>SPAN
              <h1>H1</h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'DIV' })
    })
    it('test for a template with 1 of 3 nodes with text (4)', () => {
      const ret = testHarvester(`
      div
        span{text}
          h1`, `
      <html lang="en">
        <body>
          <div>DIV
            <span>SPAN
              <h1>H1</h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'SPAN' })
    })
    it('test for a template with 1 of 3 nodes with text (4)', () => {
      const ret = testHarvester(`
      div
        span
          h1{text}`, `
      <html lang="en">
        <body>
          <div>DIV
            <span>SPAN
              <h1>H1</h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'H1' })
    })
    it('test for a template with 1 of 3 nodes with text (5)', () => {
      const ret = testHarvester(`
      div
        div{text}
          div`, `
      <html lang="en">
        <body>
          <div>DIV
            <span>SPAN
              <h1>H1</h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'DIV' })
    })
    it('test for a template with 1 of 3 nodes with text (6)', () => {
      const ret = testHarvester(`
      div
        div
          div{text}`, `
      <html lang="en">
        <body>
          <div>DIV
            <span>SPAN
              <h1>H1</h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'DIV' })
    })
    it('test for incorrect DOM structure', () => {
      const ret = testHarvester(`
      h1{text}
        div
          div`, `
      <html lang="en">
        <body>
          <div>DIV
            <span>SPAN
              <h1>H1</h1>
            </span>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'H1' })
    })
    it('test for similar DOM nodes', () => {
      const ret = testHarvester(`
      div{text}
        div
          div`, `
      <html lang="en">
        <body>
          <div>DIV0
            <div>DIV1
              <div>DIV2</div>
            </div>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'DIV0' })
    })
    it('test for similar DOM nodes (1)', () => {
      const ret = testHarvester(`
      div
        div{text}
          div`, `
      <html lang="en">
        <body>
          <div>DIV0
            <div>DIV1
              <div>DIV2</div>
            </div>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'DIV1' })
    })
    it('test for similar DOM nodes (2)', () => {
      const ret = testHarvester(`
      div
        div
          div{text}`, `
      <html lang="en">
        <body>
          <div>DIV0
            <div>DIV1
              <div>DIV2</div>
            </div>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ text: 'DIV2' })
    })
    it('test for similar DOM nodes (3)', () => {
      const ret = testHarvester(`
      div{t0}
        div{t1}
          div`, `
      <html lang="en">
        <body>
          <div>DIV0
            <div>DIV1
              <div>DIV2</div>
            </div>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t0: 'DIV0', t1: 'DIV1' })
    })
    it('test for similar DOM nodes (4)', () => {
      const ret = testHarvester(`
      div{t0}
        div
          div{t1}`, `
      <html lang="en">
        <body>
          <div>DIV0
            <div>DIV1
              <div>DIV2</div>
            </div>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t0: 'DIV0', t1: 'DIV2' })
    })
    it('test for similar DOM nodes (5)', () => {
      const ret = testHarvester(`
      div{t0}
        div{t1}
          div{t2}`, `
      <html lang="en">
        <body>
          <div>DIV0
            <div>DIV1
              <div>DIV2</div>
            </div>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t0: 'DIV0', t1: 'DIV1', t2: 'DIV2' })
    })
    it('test for similar DOM nodes (5)', () => {
      const ret = testHarvester(`
      div
        div{t1}
          div{t2}`, `
      <html lang="en">
        <body>
          <div>DIV0
            <div>DIV1
              <div>DIV2</div>
            </div>
          </div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t1: 'DIV1', t2: 'DIV2' })
    })
    it('test for similar DOM nodes on one level', () => {
      const ret = testHarvester(`
        div{t0}
        div{t1}
        div{t2}`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <div>DIV1</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t0: 'DIV0', t1: 'DIV1', t2: 'DIV2' })
    })
    it('test for similar DOM nodes on one level (1)', () => {
      const ret = testHarvester(`
        div{t0}
        div
        div`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <div>DIV1</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t0: 'DIV0' })
    })
    it('test for similar DOM nodes on one level (2)', () => {
      const ret = testHarvester(`
        div
        div{t1}
        div`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <div>DIV1</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t1: 'DIV1' })
    })
    it('test for similar DOM nodes on one level (3)', () => {
      const ret = testHarvester(`
        div
        div
        div{t2}`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <div>DIV1</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t2: 'DIV2' })
    })
    it('test for similar DOM nodes on one level (4)', () => {
      const ret = testHarvester(`
        div{t0}
        div
        div{t2}`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <div>DIV1</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t0: 'DIV0', t2: 'DIV2' })
    })
    it('test for similar DOM nodes on one level (5)', () => {
      const ret = testHarvester(`
        div{t0}
        div{t1}
        div`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <div>DIV1</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t0: 'DIV0', t1: 'DIV1' })
    })
    it('test for similar DOM nodes on one level (6)', () => {
      const ret = testHarvester(`
        div
        div{t1}
        div{t2}`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <div>DIV1</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t1: 'DIV1', t2: 'DIV2' })
    })
    it('test for similar DOM nodes on one level and other nodes', () => {
      const ret = testHarvester(`
        div
        div{t1}
        div{t2}`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <span>SPAN</span>
          <div>DIV1</div>
          <div>DIV11</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t1: 'DIV1', t2: 'DIV11' })
    })
    it('test for similar DOM nodes on one level and other nodes (1)', () => {
      const ret = testHarvester(`
        div
        div{t1}
        div{t2:with:DIV2}`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <span>SPAN</span>
          <div>DIV1</div>
          <div>DIV11</div>
          <div>DIV2</div>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t1: 'DIV1', t2: 'DIV2' })
    })
    it('test for similar DOM nodes on one level and other nodes (2)', () => {
      const ret = testHarvester(`
        div
        div{t1}
          div{t2:with:DIV3}`, `
      <html lang="en">
        <body>
          <div>DIV0</div>
          <span>SPAN</span>
          <div>DIV1</div>
          <div>DIV11</div>
          <div>DIV2</div>
          <span>
            <div>DIV3</div>
          </span>
        </body>
      </html>
      `, 'body > div')
      expect(ret[0]).toEqual({ t1: 'DIV1', t2: 'DIV3' })
    })
  })
})
