import { connect } from 'puppeteer-real-browser'

const HARVESTER_PATH = './node_modules/js-harvester/index.js'

export async function goto (page, fn) {
  await Promise.all([
    page.waitForNavigation({ waitUntil: ['domcontentloaded', 'networkidle2'] }),
    fn?.()
  ])
  await page.addScriptTag({ path: HARVESTER_PATH })
}

export async function open () {
  const { page } = await connect({ headless: false, args: ['--start-maximized'] })
  await page.setViewport(null)
  return page
}
