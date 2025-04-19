import { harvest } from 'js-harvester'
import { open, goto } from './utils.js'

const NEWS_QUERY = '.container_sub_news_list div.article_news_list'
const TPL = `
  div{time}
  div
    a{title}`
const page = await open()

await goto(page, async () => page.goto('https://www.pravda.com.ua/news/'))
const news = await page.evaluate((tpl, query) => {
  return Array.from(document.querySelectorAll(query)).map(el => harvest(tpl, el)[0])
}, TPL, NEWS_QUERY)

console.log(news, '\nPress Ctrl-C to stop...')
