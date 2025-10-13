import { harvestPageAll } from 'js-harvester/puppeteer.js'
import { open, goto } from './utils.js'

const NEWS_QUERY = '.section_news_list_wrapper div.article_news_list'
const TPL = `
  div{time}
  div
    a{title}`
const page = await open()

await goto(page, async () => page.goto('https://www.pravda.com.ua/news/', { waitUntil: 'load' }))
await page.waitForSelector(NEWS_QUERY)
const news = await harvestPageAll(page, TPL, NEWS_QUERY, { inject: true, dataOnly: true })
console.log(news, '\nPress Ctrl-C to stop...')
