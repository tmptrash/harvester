import { harvestPageAll } from 'js-harvester/playwright.js'
import { open } from './utils.js'

const NEWS_QUERY = '.container_sub_news_list div.article_news_list'
const TPL = `
  div{time}
  div
    a{title}`
const page = await open()

await page.goto('https://www.pravda.com.ua/news/', { waitUntil: 'load' })
const news = await harvestPageAll(page, TPL, NEWS_QUERY, { inject: true, dataOnly: true })
console.log(news, '\nPress Ctrl-C to stop...')

