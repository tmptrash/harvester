import { harvest } from 'js-harvester'
import { open, goto } from './utils.js'

const PRODUCTS_QUERY = 'rz-product-tile'
const TPL = `
  rz-product-tile
    div
      *
        img[img=src]
      *{title}
      div
        rz-tile-price
          div{oldPrice}
          div{price:func:price}
`
const page = await open()

await goto(page, async () => page.goto('https://rozetka.com.ua/'))
const news = await page.evaluate((tpl, query) => {
  window.price = function price (t, el) { return el.className.indexOf('price') > -1 }
  return Array.from(document.querySelectorAll(query)).map(el => harvest(tpl, el)[0])
}, TPL, PRODUCTS_QUERY)

console.log(news, '\nPress Ctrl-C to stop...')
