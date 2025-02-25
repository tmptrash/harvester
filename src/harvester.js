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
const LINE_RE =
  /^( *)?([a-zA-Z0-9_-]+)(?:\{([a-zA-Z0-9_]+)\})?(?:\[([a-zA-Z0-9_-]+)=([a-zA-Z0-9_-]+?)\])? *$/
/**
 * Special constant for the jsdom emulation. The same like Node.TEXT_NODE under browser
 */
const TEXT_NODE = 3
/**
 * Displays an error message during parsing of the pseudo tree-like string.
 * @param {String} line The current line being parsed.
 * @param {Number} l Line number.
 * @param {String} msg Error message.
 */
function logErr(line, l, msg) {
  console.error(`Error in line '${line}' #:${l}. ${msg}.`)
}
/**
 * Recursively converts a pseudo tree-like string into an array of nodes.
 * Invalid nodes are skipped and only valid lines will be in final JSON tree.
 * Full format of one line is: "  tag[textTag]{attrTag=attrName}".
 * 
 * @param {String[]} lines The pseudo tree-like string split into lines.
 * @param {Number} l Current line index.
 * @param {Object[]} nodes Array to store parsed nodes.
 * @param {Number} level Current indentation level.
 * @param {Number} startSpaces Left padding of the first not empty tag in a tree
 * @returns {[Number, Number]} The updated line index and level difference.
 */
function parse(lines, l, nodes, level, startSpaces = -1) {
  for (let i = l; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line.trim() === '') continue
    const m = line.match(LINE_RE) // 1: spaces, 2: tag, 3: textTag
    if (!m) {logErr(line, i, `Wrong line format`); continue}
    const spaces = m[1]?.length || 0
    if (spaces % SPACE_AMOUNT !== 0) {
      logErr(line, i, `Wrong left indentation. Must be a multiple of ${SPACE_AMOUNT}`)
      continue
    }
    if (startSpaces < 0) startSpaces = spaces
    if ((spaces - startSpaces) % SPACE_AMOUNT !== 0) {
      logErr(line, i, `Wrong left indentation. Must be a multiple of ${SPACE_AMOUNT}`)
      continue
    }
    const curLevel = (spaces - startSpaces) / SPACE_AMOUNT
    if (curLevel < 0) {logErr(line, i, `Wrong left indentation level`); continue}
    if (curLevel > level && curLevel - level > 1) {
      logErr(line, i, `Wrong left indentation level`)
      continue
    }
    if (m[4] && !m[5]) {
      logErr(line, i, `Wrong attribute format. Should be [attrTag=attrName]`)
      continue
    }
    const node = {tag : m[2]}
    m[3] && (node.textTag = m[3])
    m[4] && (node.attrTag = [m[4], m[5]])
    if (curLevel === level) nodes.push(node)
    else if (curLevel > level) {
      if (!nodes.length) {logErr(line, i, `Wrong left indentation level`); continue}
      nodes[nodes.length - 1].children = []
      let ret
      [i, ret] = parse(lines, i, nodes[nodes.length - 1].children, level + 1, startSpaces)
      if (ret) return [i, ret - 1]
    }
    else return [i - 1, level - curLevel - 1]
  }
  
  return [lines.length, 0]
}
/**
 * Converts a pseudo tree-like string into a JSON tree. Only valid nodes will be parsed.
 * @param {String} tpl The pseudo tree-like string in format:
 * 
 * div
 *   span
 *     h1{h1}
 *     img{text}[src=src]
 * 
 * @returns {Object[]} Parsed tree structure.
 */
function toTree(tpl) {
  const lines = tpl.split('\n')
  const nodes = []
  parse(lines, 0, nodes, 0)
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
 * Retrieves the first direct trimmed text content of an element, skipping nested elements.
 * @param {Element} el The DOM element.
 * @returns {String|undefined} The text content or undefined if none found.
 */
function text(el) {
  if (!el) return undefined
  for (const child of el.childNodes) {
    if (child.nodeType === TEXT_NODE) {
      const t = child.textContent.trim()
      if (t) return t
    }
  }
  return undefined
}
/**
 * Returns all possible variants of nodes of the one level. Is used to compare all possible
 * nodes variants of pseudo tree and DOM nodes of one level.
 * @param {Node[]} nodes Array of nodes we have create variants from
 * @returns {Nodes[][]} Array of arrays of Nodes combinations
 * 
 * @example
 * const nodes = [{tag: 'div'}, {tag: 'span'}]
 * const vars = subsets(nodes) // [[{tag: 'div'}], [{tag: 'span'}], [{tag: 'div'}, {tag: 'span'}]]
 */
function subsets(nodes) {
  if (!nodes) return []
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
 * Makes a deep copy of the object or an array. skipProps is used to skip some properties
 * and copy them as is. This is your responsibility to pass obj parameter without circular
 * nodes. Use skipProps for that.
 * @param {Object|Array} obj Object or array to copy
 * @param {Object} skipProps Map of the properties we have to skip during copy
 * @returns {Object|Array} Copy of object or array
 */
function copy(obj, skipProps = SKIP) {
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
 * @param {Object|Array} obj Object or array to traverse.
 * @param {Function} cb Callback function (cb(node, key)) for every node
 * @param {Object} skipProps Properties to skip during traversal.
 */
function walk(obj, cb, skipProps = SKIP) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (!skipProps[i]) cb(obj[i], i), walk(obj[i], cb, skipProps)
    }
  } else if (typeof obj === 'object') {
    for (const p in obj) {
      if (!skipProps[p]) cb(obj[p], p), walk(obj[p], cb, skipProps)
    }
  } else cb(obj)
}
/**
 * Finds all nodes in a DOM tree according to JSON tree. The starting format of one JSON node 
 * is following: {el: Element, tag: str, textTag: str, children: []}, where: el - reference
 * to DOM element, tag - name of the HTML tag we are looking for, score - score of the 
 * current node (+1 if tag exist, +1 if textTag is not empty and HTML element also contains
 * a text in it), text - text from HTML tag, textTag - name of the text alias (will be used
 * later for creating data map), children - an array of the same nodes to support recursion
 * search, attrTag - an array of two elements with name of the attribute tag and name of the
 * attribute of the DOM element. After all nodes will be found "score" and "text" properties 
 * will be added into the result nodes. The minimum node contains only "tag" property. This
 * function uses fuzzy trees comparison and don't violate sequence of nodes on the same level.
 * So if we are looking for span, div, h1 on one level their order is important. It's possible
 * to have tags between them, but div is always stays after span and h1 is always after div 
 * and span.
 * 
 * @param {Object} parentTpl Parent node of the children we are comparing
 * @param {Element} parentEl Assocoated with parentTpl node element in a DOM
 * @param {Number} level Current level during compare
 * @param {Number} maxLevel Max level we may go to
 * @returns [score, Nodes[]|undefined]
 */
function match(parentTpl, parentEl, level, maxLevel) {
  if (!parentTpl || !parentEl) return [0, undefined]
  const tplNodes = parentTpl.children
  const firstEl = parentEl.firstElementChild
  if (!firstEl || !tplNodes) return [0, undefined]
  let maxScore = 0
  let maxNodes

  if (level < maxLevel) {
    /**
     * First, we check similar nodes in a one level deeper without combinations. This variant
     * is used when DOM tree has extra nodes between current nodes in pseudo tree and DOM tree.
     * For example (pseudo tree on the left and DOM tree on the right):
     * 
     * h1
     * h1 -> div
     *         h1
     *         h1
     * 
     * In this example, we have to find two h1 tags inside the div, but div itself should be 
     * skipped. We also should decrease score with -1 score, because we are skipping one level
     * in a DOM tree. Every level skip decreases score with 1. So max possible score here === 2,
     * but algorithm should return 1 (2 - 1: two h1 tags found minus one skipped level).
     */
    let el = firstEl
    while (el) {
      const firstChild = el.firstElementChild
      if (firstChild) {
        const [deepScore, deepNodes] = match(parentTpl, el, level + 1, maxLevel)
        if (deepScore - 1 > maxScore && deepNodes) maxScore = deepScore - 1, maxNodes = deepNodes
      }
      el = el.nextElementSibling
    }
    /**
     * Second, we check similar nodes in one level upper without combinations. This variant
     * is used when DOM tree has a lack of nodes between current nodes in pseudo tree and DOM
     * tree. For example (pseudo tree on the left and DOM tree on the right):
     * 
     *         h1
     * div  -> h1
     *   h1      div
     *   h1
     * 
     * In this example, we have to find two h1 tags of a div in a pseudo tree in a DOM tree.
     * Please pay attention on the fact that two h1 tags in a DOM tree are on the root level
     * and we have to skip div tag in a pseudo tree. In this case we also should decrease score
     * with 1, because we skip one level in a pseudo tree. And again every level skipping
     * decreases score with 1. Max possible score here is 3, but algorithm returns 1 (2 - 1:
     * 2 h1 tags found minus one level skipped).
     */
    const upParent = parentEl?.parentNode
    if (upParent) {
      const [upScore, upNodes] = match(parentTpl, upParent, level + 1, maxLevel)
      if (upScore - 1 > maxScore && upNodes) maxScore = upScore - 1, maxNodes = upNodes
    }
  }
  /**
   * Third, we check similar nodes on the same level with all possible combinations of pseudo
   * tree. For example if we have 2 nodes: [{tag: 'div'}, {tag: 'span'}], we will have 3
   * possible combinations with different max scores:
   * 
   * 1. [{tag: 'div'}]                 // max score 1
   * 2. [{tag: 'span'}]                // max score 1
   * 3. [{tag: 'div'}, {tag: 'span'}]  // max score 2
   * 
   * It picks every combination of pseudo nodes and try to find it in a DOM tree. The tree with
   * maximized score will be returned as a result.
   */
  const combinations = copy(subsets(tplNodes))
  for (let c = 0; c < combinations.length; c++) {
    const comb = combinations[c]
    let i = 0
    comb[0].el = firstEl
    for (let i = 1; i < comb.length; i++) comb[i].el = undefined
    while (true) {
      const node = comb[i]
      const el = node.el
      if (el) {
        node.score = 0
        // here we check tag name, tag text and attribute
        const correctTag = el.tagName?.toLowerCase() === node.tag
        if (correctTag) {
          node.score++
          if (node.textTag) {const t = text(el); t && (node.text = t) && node.score++}
          if (node.attrTag) {
            const a = el.getAttribute(node.attrTag[1])
            a && (node.attr = a) && node.score++
          }
        }
        // Here we go deeper and check inner nodes
        if (el?.firstElementChild) {
          const score = node.score
          if (node.children) {
            match(node, el, level, maxLevel)
            node.score += score
          }
        }

        if (i >= comb.length - 1) {
          i = comb.length - 1
          // all nodes found let's check if it's a best score
          const nodesScore = comb.reduce((acc, cur) => acc + cur.score || 0, 0)
          if (nodesScore > maxScore) maxScore = nodesScore, maxNodes = copy(comb)
        } else i++
      } else if (--i < 0) break
      // skip all text nodes
      comb[i].el = (comb[i]?.el || el)?.nextElementSibling
    }
  }

  if (maxNodes?.length) {
    parentTpl.children = maxNodes
    parentTpl.score = maxScore
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
 * in out tpl in a DOM.
 * 
 * @param {String} tpl template of pseudo tree-like string
 * @param {Element} firstEl Reference to the first DOM element for nodes[0]
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
 * harvest(tpl, $('div')) // [{title: 'Title', price: '12.34', img: 'http://...'}, 7, 6, [...]]
 */
function harvest(tpl, firstEl) {
  const tplNodes = {tag: 'root', children: toTree(tpl)} // add one more level as a root element
  let tplScore = 0
  walk(tplNodes, d => {d?.tag && tplScore++, d.textTag && tplScore++, d.attrTag && tplScore++})
  if (!firstEl) return [{}, tplScore, 0, []]
  const [score, nodes] = match(tplNodes, firstEl.parentNode, 0, tplScore)
  const map = {}
  walk(nodes, d => {
    if (!isObj(d)) return
    if (d.textTag && d.text) {
      const tag = d.textTag
      map[tag] && console.error(`Two or more equal text tags were found. Text tag: "${tag}"`)
      map[tag] = d.text
    }
    if (d.attrTag && d.attr) {
      const tag = d.attrTag[0]
      map[tag] && console.error(`Two or more equal attr tags were found. Attr tag: "${tag}"`)
      map[tag] = d.attr
    }
  })

  return [map, tplScore, score, nodes]
}

module.exports = {toTree, harvest}