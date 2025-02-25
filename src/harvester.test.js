const { JSDOM } = require('jsdom')
const { toTree, harvest } = require('./harvester')

function testHarvester(tpl, html, query) {
  const dom = new JSDOM(html)
  return harvest(tpl, dom.window.document.querySelector(query))
}

describe('harvester library tests', () => {
  let consoleSpy
  beforeEach(() => consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {}))
  afterEach(() => consoleSpy.mockRestore())
  
  describe('test toTree() function', () => {
    it('parse an empty template (1)', () => {
      const tpl = ``
      const tree = toTree(tpl)
      expect(tree).toEqual([])
    })
    it('parse an empty template (2)', () => {
      const tpl = ` `
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
      const tpl = `div`
      const tree = toTree(tpl)
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse an incorrect template (1)', () => {
      const tpl = ` div`
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template (2)', () => {
      const tpl = `   div`
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse an incorrect template (3)', () => {
      const tpl = `     div`
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([])
    })
    it('parse a correct template (1)', () => {
      const tpl = `  div`
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse a correct template (2)', () => {
      const tpl = `    div`
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse a correct template (3)', () => {
      const tpl = `    div  `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse a correct template (4)', () => {
      const tpl = `

      div

      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse a correct template (5)', () => {
      const tpl = `
      div
      span
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}, {tag: 'span'}])
    })
    it('parse an incorrect template with bad level', () => {
      const tpl = `
        div
      span
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse an incorrect template with bad levels', () => {
      const tpl = `
          div
        span
      h1
      `
      const tree = toTree(tpl)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse a correct template with tag name (1)', () => {
      const tpl = `
        div_123
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div_123'}])
    })
    it('parse a correct template with tag name (2)', () => {
      const tpl = `
        div-123
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div-123'}])
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
      expect(tree).toEqual([{tag: 'div', textTag: 'text'}])
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
      expect(tree).toEqual([{tag: 'div', textTag: 'text', attrTag: ['test', 'href']}])
    })
    it('parse a correct template with an attr', () => {
      const tpl = `
        div[test=href]
      `
      const tree = toTree(tpl)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div', attrTag: ['test', 'href']}])
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
      expect(tree).toEqual([{tag: 'div', children: [{tag: 'div'}]}, {tag: 'h1'}])
    })
    it('parse a correct template with different levels (1)', () => {
      const tree = toTree(`
      div
      div
        span`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}, {tag: 'div', children: [{tag: 'span'}]}])
    })
    it('parse a correct template with different levels (2)', () => {
      const tree = toTree(`
      div
        div
          h1`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div', children: [{tag: 'div', children: [{tag: 'h1'}]}]}])
    })
    it('parse a correct template with different levels (3)', () => {
      const tree = toTree(`
      div
        div
      h1`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div', children: [{tag: 'div'}]}, {tag: 'h1'}])
    })
    it('parse a correct template with different levels (4)', () => {
      const tree = toTree(`
      div
        div
      h1
        table`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([
        {tag: 'div', children: [{tag: 'div'}]}, {tag: 'h1', children: [{tag: 'table'}]}
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
        {tag: 'div', children: [{tag: 'div', children: [{tag: 'h1'}]}]}, {tag: 'table'}
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
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse an incorrect template with broken levels (3)', () => {
      const tree = toTree(`
      div
          div
      span`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}, {tag: 'span'}])
    })
    it('parse an incorrect template with broken levels (4)', () => {
      const tree = toTree(`
      div
    div
      span`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}, {tag: 'span'}])
    })
    it('parse an incorrect template with broken levels & with text (1)', () => {
      const tree = toTree(`
      div{l1}
    div{l2}
      span{l3}`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div', textTag: 'l1'}, {tag: 'span', textTag: 'l3'}])
    })
    it('parse an incorrect template with broken levels & with text (2)', () => {
      const tree = toTree(`
      div{l1}
          div{l2}
      span{l3}`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div', textTag: 'l1'}, {tag: 'span', textTag: 'l3'}])
    })
    it('parse a correct template with text (1)', () => {
      const tree = toTree(`
      div{l1}
        div{l2}
      span{l3}`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([
        {tag: 'div', textTag: 'l1', children: [{tag: 'div', textTag: 'l2'}]},
        {tag: 'span', textTag: 'l3'}
      ])
    })
    it('parse a correct template with text (2)', () => {
      const tree = toTree(`
      div
        div{l2}`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div', children: [{tag: 'div', textTag: 'l2'}]}])
    })
    it('parse an incorrect template with empty text', () => {
      const tree = toTree(`
      div
        div{}`)
      expect(consoleSpy).toHaveBeenCalled()
      expect(tree).toEqual([{tag: 'div'}])
    })
    it('parse a correct template with texts & attrs', () => {
      const tree = toTree(`
      div{text}[src=href]
        h1{div}[href=src]`)
      expect(consoleSpy).not.toHaveBeenCalled()
      expect(tree).toEqual([
        {tag: 'div', textTag: 'text', attrTag: ['src', 'href'], children: [
          {tag: 'h1', textTag: 'div', attrTag: ['href', 'src']}
        ]}
      ])
    })
  })

  describe('test harvest() function', () => {
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
    it('test complex template and the DOM', () => {
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
      expect(ret[0]).toEqual({h1: 'H1', h2: 'H2'})
      expect(ret[1]).toEqual(5)
      expect(ret[2]).toEqual(3)
    })
    it('test complex template and the DOM', () => {
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
      expect(ret[0]).toEqual({span: 'span1', h1: 'H1', div: 'div'})
      expect(ret[1]).toEqual(7)
      expect(ret[2]).toEqual(6)
    })
  })
})