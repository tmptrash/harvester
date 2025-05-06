import { HARVESTER_PATH, isObj, isFunc, isStr } from './utils'

/**
 * Just a helper function to check harvestPage() & harvestPageAll() functions arguments. It also
 * injects harvester.js script into the page if opt.inject option is set to true. Throws an
 * exception in case of error
 * @param {Page} page Browser's page instance to work on
 * @param {String} tpl Pseudo tree-like template of data we are searching for
 * @param {String} query CSS Query of first element we are start searching from
 * @param {Object} opt Options for this function. It's a different options than harvester() func opt
 */
async function initHarvester (page, tpl, query, opt = {}) {
  if (!page || !isObj(page) || !isFunc(page.evaluate)) throw new Error('"page" argument is not set or not a Page instance')
  if (!tpl || !isStr(tpl)) throw new Error('"tpl" argument is not set or not a string')
  if (!query || !isStr(query)) throw new Error('"query" argument is not set or not a string')
  if (opt.inject) {
    if (!opt.path) opt.path = HARVESTER_PATH
    try {
      return page.addScriptTag({ path: opt.path })
    } catch (e) { throw new Error(`Error while injecting harvester library into the HTML page: ${e}`) }
  }
}
/**
 * Extracts one peace of data by template, query, options and returns a Promise. It works with
 * Puppeteer's page object, so you may use it in your Puppeteer projects. You may use additional
 * options like "inject" - to inject harvester.js file into the destination HTML file. In this case
 * take a look on "path" option, which by default is equal to HARVESTER_PATH. Otherwise you have to
 * inject harvester.js file in your client's code. Pay attention that calling this function more than
 * once will inject harvester.js into the page few times.
 * @param {Page} page Browser's page instance to work on
 * @param {String} tpl Pseudo tree-like template of data we are searching for
 * @param {String} query CSS Query of first element we are start searching from
 * @param {Object} opt Options for this function. It's a different options than harvester() func opt
 * @returns {Promise<[Object, maxScore, score, metaTree]>} Returns promise with harvested data in an
 * array of four elements
 */
export async function harvestPage (page, tpl, query, opt = {}) {
  await initHarvester(page, tpl, query, opt)

  return page.evaluate(([tpl, query, opt]) => {
    const el = document.querySelector(query)
    if (!el) throw new Error(`Selector "${query}" not found`)
    return harvest(tpl, el, opt) // eslint-disable-line no-undef
  }, [tpl, query, opt])
}
/**
 * Extracts all peaces of data by template, query, options and returns a Promise. It works with
 * Puppeteer's page object, so you may use it in your Puppeteer projects. The difference between this
 * function and harvestPage() that this one will find all DOM elements for "query" parameter and
 * extract all data peaces in an array. You may use additional options like "inject" - to inject
 * harvester.js file into the destination HTML file. In this case take a look on "path" option,
 * which by default is equal to HARVESTER_PATH. Otherwise you have to inject harvester.js file in
 * your client's code. Pay attention that calling this function more than once will inject harvester.js
 * into the page few times.
 * @param {Page} page Browser's page instance to work on
 * @param {String} tpl Pseudo tree-like template of data we are searching for
 * @param {String} query CSS Query of first element we are start searching from
 * @param {Object} opt Options for this function. It's a different options than harvester() func opt
 * @returns {Promise<[Object, maxScore, score, metaTree]>} Returns promise with harvested data in an
 * array of four elements
 */
export async function harvestPageAll (page, tpl, query, opt = {}) {
  await initHarvester(page, tpl, query, opt)

  return page.evaluate(([tpl, query, opt]) => {
    const els = document.querySelectorAll(query)
    if (!els || !els.length) throw new Error(`Selector "${query}" not found`)
    return Array.from(els).map(el => harvest(tpl, el, opt)) // eslint-disable-line no-undef
  }, [tpl, query, opt])
}
