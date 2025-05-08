import { chromium } from 'playwright'

export const HARVESTER_PATH = './node_modules/js-harvester/src/harvester.js'

export async function open () {
  const browser = await chromium.launch({ headless: false })
  return browser.newPage()
}
