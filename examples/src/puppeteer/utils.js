import { connect } from 'puppeteer-real-browser'

export const HARVESTER_PATH = './node_modules/js-harvester/src/harvester.js'

export async function goto (page, fn, inject = false) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: ['domcontentloaded', 'networkidle2'] }),
    fn?.()
  ])
  inject && await page.addScriptTag({ path: HARVESTER_PATH })
}

export async function open () {
  const { page } = await connect({ headless: false })
  await page.setViewport(null)
  await page.setUserAgent('Chrome/111.0.0.0 Safari/537.36')
  return page
}
