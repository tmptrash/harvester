import { harvestPageAll } from 'js-harvester/playwright.js'
import { open } from './utils.js'

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

await page.goto('https://rozetka.com.ua/', { waitUntil: 'load' })
await page.evaluate(() => { window.price = function price (_, el) { return el.className.indexOf('price') > -1 } })
const news = await harvestPageAll(page, TPL, PRODUCTS_QUERY, { inject: true, dataOnly: true })
console.log(news, '\nPress Ctrl-C to stop...')
