export const HARVESTER_PATH = './node_modules/js-harvester/src/harvester.js'

/**
 * Checks if a value is an Object
 * @param {*} val Value to check
 * @returns {Boolean}
 */
export function isObj (val) {
  return val !== null && typeof val === 'object'
}
/**
 * Checks if a val is a string
 * @param {*} val
 * @returns {Boolean}
 */
export function isStr (val) {
  return typeof val === 'string' || val instanceof String
}
/**
 * Checks if an argument is a function
 * @param {*} val - Value to check
 * @returns {Boolean}
 */
export function isFunc (val) {
  return typeof val === 'function'
}
