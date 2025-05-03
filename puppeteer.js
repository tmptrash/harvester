/**
 * Checks if a value is an Object
 * @param {*} val Value to check
 * @returns {Boolean}
 */
function isObj (val) {
  return val !== null && typeof val === 'object'
}
/**
 * Checks if a val is a string
 * @param {*} val
 * @returns {Boolean}
 */
function isStr (val) {
  return typeof val === 'string' || val instanceof String
}
/**
 * Checks if an argument is a function
 * @param {*} val - Value to check
 * @returns {Boolean}
 */
function isFunc (val) {
  return typeof val === 'function'
}
/**
 * Extracts one peace of data by template, query and options and returns a Promise. It works with
 * Puppeteer's page object, so you may use it in your Puppeteer projects
 * @param {Page} page Browser's page instance to work on
 * @param {String} tpl Pseudo tree-like template of data we are searching for
 * @param {String} query CSS Query of first element we are start searching from
 * @param {Object} opt Options for this function. It's a different options than harvester() func opt
 * @returns {Promise<[Object, maxScore, score, metaTree]>} Returns promise with harvested data in an
 * array of four elements
 */
export async function harvestPage (page, tpl, query, opt = {}) {
  if (!page || !isObj(page) || !isFunc(page.evaluate)) throw new Error('"page" argument is not set or not a Page instance')
  if (!tpl || !isStr(tpl)) throw new Error('"tpl" argument is not set or not a string')
  if (!query || !isStr(query)) throw new Error('"query" argument is not set or not a string')
  if (opt.inject) {
    try {
      await page.addScriptTag({ path: opt.path })
    } catch (e) { throw new Error('Error while injecting harvester library into the HTML page', e) }
  }

  return page.evaluate((query, tpl, opt) => {
    const el = document.querySelector(query)
    if (!el) throw new Error(`Selector "${query}" not found`)
    return harvest(tpl, el, opt) // eslint-disable-line no-undef
  }, query, tpl, opt)
}
