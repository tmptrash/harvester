/**
 * Properties to skip during deep copy or traversal of arrays/objects.
 */
const SKIP = {el: true}
/**
 * Number of spaces representing one indentation level.
 */
const SPACE_AMOUNT = 2
/**
 * Regular expression to parse a single line of the pseudo tree-like string.
 * Matches: indentation, tag name, optional text, and optional attribute.
 */
const LINE_RE = /^( *)?([a-zA-Z0-9_-]+)(?:\{([^}]*)\})?(?:\[([a-zA-Z0-9_-]+)=([a-zA-Z0-9_-]+?)\])?$/
/**
 * Displays an error message during parsing of the pseudo tree-like string.
 * @param {String} line The current line being parsed.
 * @param {Number} l Line number.
 * @param {String} msg Error message.
 */
function err(line, l, msg) {
  console.error(`Error in line '${line}' #:${l}. ${msg}.`)
}
/**
 * Recursively converts a pseudo tree-like string into an array of tree nodes.
 * Invalid nodes are skipped.
 * @param {String[]} lines The pseudo tree-like string split into lines.
 * @param {Number} l Current line index.
 * @param {Object[]} nodes Array to store parsed nodes.
 * @param {Number} level Current indentation level.
 * @param {Number} startSpaces Left padding of the first not empty tag in a tree
 * @returns {[Number, Number]} The updated line index and level difference.
 */
function tree(lines, l, nodes, level, startSpaces = -1) {
  for (let i = l; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    const m = line.match(LINE_RE) // 1: spaces, 2: tag, 3: textTag
    if (!m) {err(line, i, `Wrong line format`); continue}
    const spaces = m[1]?.length || 0
    if (spaces % SPACE_AMOUNT !== 0) {err(line, i, `Wrong left indention. Must be a multiple of ${SPACE_AMOUNT}`); continue}
    if (startSpaces < 0) startSpaces = spaces
    if ((spaces - startSpaces) % SPACE_AMOUNT !== 0) {err(line, i, `Wrong left indention. Must be a multiple of ${SPACE_AMOUNT}`); continue}
    const curLevel = (spaces - startSpaces) / SPACE_AMOUNT
    if (curLevel > level && curLevel - level > 1) {err(line, i, `Wrong left indention level`); continue}
    const node = {tag : m[2]}
    m[3] && (node.textTag = m[3])
    if (m[4] && !m[5]) {err(line, i, `Wrong attribute format. Should be [attrTag=attrName]`); continue}
    m[4] && (node.attrTag = [m[4], m[5]])
    if (curLevel === level) nodes.push(node)
    else if (curLevel > level) {
      if (!nodes.length) {err(line, i, `Wrong left indention level`); continue}
      nodes[nodes.length - 1].children = []
      let ret
      [i, ret] = tree(lines, i, nodes[nodes.length - 1].children, level + 1, startSpaces)
      if (ret) return [i, ret - 1]
    }
    else return [i - 1, level - curLevel - 1]
  }
  
  return [lines.length, 0]
}
/**
 * Converts a pseudo tree-like string into a structured tree.
 * @param {String} tpl The pseudo tree-like string.
 * @returns {Object[]} Parsed tree structure.
 */
function toTree(tpl) {
  const lines = tpl.split('\n')
  const nodes = []
  tree(lines, 0, nodes, 0)
  return nodes
}
/**
 * Checks if a value is a non-null object.
 * @param {*} val Value to check.
 * @returns {Boolean} True if val is an object, false otherwise.
 */
function isObj(val) {
  return typeof val === 'object' && !Array.isArray(val) && val !== null
}
/**
 * Retrieves the first direct text content of an element, skipping nested elements.
 * @param {Element} el The DOM element.
 * @returns {String|undefined} The text content or undefined if none found.
 */
function text(el) {
  if (!el) return null
  let t;
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      t = child.textContent.trim()
      break
    }
  }

  return t || undefined
}
/**
 * Returns all possible variants of nodes of the one level. For example if we have two
 * nodes, variants will be like this:
 * 
 * @param {Node[]} nodes Array of nodes we have create variants from
 * @returns 
 * 
 * @example
 * const nodes = [{tag: 'div'}, {tag: 'span'}]
 * const vars = variants(nodes) // -> [[{tag: 'div'}], [{tag: 'span'}], [{tag: 'div'}, {tag: 'span'}]]
 */
function variants(nodes) {
  const len = nodes.length
  const size = 1 << len
  const result = new Array(size - 1)

  for (let i = 1, idx = 0; i < size; i++) {
    const subset = []
    for (let j = 0; j < len; j++) (i & (1 << j)) && subset.push(nodes[j])
    subset.length && (result[idx++] = subset)
  }

  return result
}
/**
 * Makes a deep copy of the object or array. skipProps is used to skip some properties
 * and copy them as is.
 * @param {Object|Array} obj Object to copy
 * @param {Object} skipProps Map of the properties we have to skip during traverse
 * @returns {Object|Array} Copied object or array
 */
function copy(obj, skipProps = {}) {
  if (!obj) return obj
  let cpy = obj
  if (Array.isArray(obj)) {
    cpy = new Array(obj.length)
    for (let i = 0; i < obj.length; i++) cpy[i] = copy(obj[i], skipProps)
  } else if (typeof obj === 'object') {
    cpy = {}
    for (const p in obj) cpy[p] = (skipProps[p] ? obj[p] : copy(obj[p], skipProps))
  }
  return cpy
}
/**
 * Recursively traverses an object or array, applying a callback to each node.
 * @param {Object|Array} obj Structure to traverse.
 * @param {Function} cb Callback function (cb(node, key)).
 * @param {Object} skipProps Properties to skip during traversal.
 */
function traverse(obj, cb, skipProps = {}) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (!skipProps[i]) cb(obj[i], i), traverse(obj[i], cb, skipProps)
    }
  } else if (typeof obj === 'object') {
    for (const p in obj) {
      if (!skipProps[p]) cb(obj[p], p), traverse(obj[p], cb, skipProps)
    }
  } else cb(obj)
}
/**
 * Makes one step in trees comparison process with recursion. First we go deep into 
 * the DOM element, but decrease score by 1, because we cut current JSON node and 
 * check if deeper node is similar. Also, we check nextChild on the same level and 
 * not decrease a score. So we do two checks here: one deeper and one on the same 
 * level and compares which variant is better (with bigger score). Result will be
 * stored into the node. This function is used inside find().
 * @param {Node} node 
 */
function step(node) {
  if (!node.el) return
  let score = -1
  let deepNodes
  const firstChild = node.el.firstElementChild
  if (firstChild && node.children) {
    [score, deepNodes] = find(copy([node], SKIP), firstChild)
  }
  // This is a second part, where we check nodes of the same level (node.el.nextSibling)
  node.score = 0
  const correctTag = node.el.tagName?.toLowerCase() === node.tag
  if (correctTag) {
    node.score++
    node.textTag && (node.text = text(node.el)) && node.score++
    node.attrTag && (node.attr = node.el.getAttribute(node.attrTag[1])) && node.score++
  }
  if (node.children) {
    // Here we compare our two approaches and get one, which better (with bigger score)
    const firstChild = node?.el?.firstElementChild
    const [sc, nodes] = firstChild ? find(node.children, firstChild): [0, node.children]
    if (node.score + sc > score) {
      node.score += sc
      node.children = nodes?.length ? nodes : node.children
    } else if (deepNodes && score > node.score + sc) {
      node.score = score
      node.children = deepNodes?.[0]?.children ? deepNodes?.[0]?.children : node.children
      node.text = deepNodes[0].text
    }
  }
}
/**
 * Finds all nodes in a DOM tree according to JSON tree template. The format of one node
 * is following: {el: Element, tag: str, score: num, text: str, textTag: str, children: []},
 * where: el - reference to DOM element, tag - name of the HTML tag we are looking for, score -
 * score of the current node (+1 if tag exist, +1 if textTag is not empty and HTML element also
 * contains a text in it), text - text from HTML tag, textTag - name of the text alias (will
 * be used later for creating data map), children - an array of the same nodes to support 
 * recursion search.
 * @param {Array} nodes Array of nodes
 * @param {Element} first Reference to first DOM element to start finding on
 * @returns [score, Nodes[]]
 */
function find(nodes, first) {
  if (!nodes?.length || !first) return [0, undefined]
  const combinations = variants(nodes)
  let maxScore = 0
  let maxNodes = []
  for (let c = 0; c < combinations.length; c++) {
    const comb = combinations[c]
    let i = 0
    comb[0].el = first
    for (let i = 1; i < comb.length; i++) comb[i].el = null
    while (true) {
      const node = comb[i]
      step(node)
      if (node.el) {
        if (i >= comb.length - 1) {
          i = comb.length - 1
          // all nodes found let's check if it's a best score
          const nodesScore = comb.reduce((acc, cur) => acc + cur.score || 0, 0)
          if (nodesScore > maxScore) maxScore = nodesScore, maxNodes = copy(comb, SKIP)
        } else i++
      } else if (--i < 0) break
      // skip all text nodes
      comb[i].el = (comb[i]?.el || node.el)?.nextElementSibling
    }
  }

  return [maxScore, maxNodes]
}
/**
 * Main function you should call to harvest the data from an DOM tree by template. First,
 * create a pseudo tree template like in example below. div, h1, span, img - are tag names 
 * you are looking for. title, price, img - optional names of properties in a returned map,
 * where found text|attribute will be placed. 2 spaces before tags - are nesting level. 
 * Difference between parent and child nodes may be only 2 spaces if we go from up to down. 
 * If we go from bottom to up it may be different. This template should pass as a first 
 * parameter to harvest() function. Second, firstNodeEl - should point to the first element 
 * in out tpl.
 * 
 * @param {String} tpl template of pseudo tree-like string
 * @param {Element} firstNodeEl Reference to the first DOM element for nodes[0]
 * @returns {[maxScore: Number, foundScore: Number, map: Object, foundNodes: Array]} maxScore - 
 * maximum score. It means that found tree is identical to your pseudo tree-like template; 
 * foundScore - score of found tree may be between [0..maxScore]. Shows similarity between 
 * maximum score and found; map - JavaScript object with all text tags and attribute tags in
 * it; foundNodes - found Array based tree with all metadata in it;
 * 
 * @example
 * const tpl = `
 * div
 *   h1{title}
 *   span{price}
 *   img[img=href]`
 * harvest(tpl, $('div')) //-> [{title: 'My title', price: '12.34', img: 'https://...'}, 7, 7, [...]]
 */
function harvest(tpl, firstNodeEl) {
  const nodes = toTree(tpl)
  let score = 0
  traverse(nodes, d => { if (isObj(d)) d.tag && score++, d.textTag && score++, d.attrTag && score++ }, SKIP)
  const [maxScore, maxNodes] = find(nodes, firstNodeEl)
  const map = {}
  traverse(maxNodes, d => {
    if (isObj(d)) {
      if (d.textTag && d.text) {
        if (map[d.textTag]) console.error(`Two or more equal text tags were found. Found text tag: "${d.textTag}"`)
        map[d.textTag] = d.text
      }
      if (d.attrTag && d.attr) {
        if (map[d.attrTag[0]]) console.error(`Two or more equal attr tags were found. Found attr tag: "${d.attrTag[0]}"`)
        map[d.attrTag[0]] = d.attr
      }
    }
  }, SKIP)

  return [map, score, maxScore, maxNodes]
}

module.exports = harvest