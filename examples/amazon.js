import { harvest } from 'js-harvester'
import { open, goto } from './utils.js'

const ELS_QUERY = '[role="listitem"] .s-card-container .a-section > [class=puisg-row]:nth-of-type(1)'
const TPL = `
div
  div
    span
      a
        img[img=src]
div
  div
    div
      a
        h2
          span{title}
    div
    div
    div
      div
        div
          div
            div
              div
                a
                  span
                    span{price:func:price}`
const page = await open()

await goto(page, async () => page.goto('https://www.amazon.com/s?k=laptops'))
const products = await page.evaluate((tpl, query) => {
  window.price = function price (t, el) { return el?.className === 'a-offscreen' && t?.indexOf('$') > -1 }
  return Array.from(document.querySelectorAll(query)).map(el => harvest(tpl, el, { minDepth: 60 })[0])
}, TPL, ELS_QUERY)

console.log(products, '\nPress Ctrl-C to stop...')
