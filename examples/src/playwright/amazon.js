import { harvestPageAll } from 'js-harvester/playwright.js'
import { open } from './utils.js'

const PRODUCTS_QUERY = '[role="listitem"] .s-card-container .a-section > [class=puisg-row]:nth-of-type(1)'
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

await page.goto('https://www.amazon.com/s?k=laptops', { waitUntil: 'load' })
await page.evaluate(() => {
  window.price = function price (t, el) { return el?.className === 'a-offscreen' && t?.indexOf('$') > -1 }
})
const products = await harvestPageAll(page, TPL, PRODUCTS_QUERY, { inject: true, dataOnly: true, minDepth: 60 })
console.log(products, '\nPress Ctrl-C to stop...')
