import { chromium } from 'playwright'

export const HARVESTER_PATH = './node_modules/js-harvester/src/harvester.js'

export async function open () {
  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext({ userAgent: 'Chrome/111.0.0.0 Safari/537.36' })
  return ctx.newPage()
}
