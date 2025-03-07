/**
 * The maximum depth of pseudo tree-like nodes after, which we a warning the user about
 * possible performance issues
 */
const MAX_DEPTH = 20
/**
 * Means how complete pseudo tree-like template will be found in a DOM tree. Should be bigger
 * then 1. For every deeper or upper level we multiply current level into this coefficient. Luke
 * this: Math.round(level * TREE_COMPLETE_COEF) || 1
 */
const TREE_COMPLETE_COEF = 1.6
/**
 * Number of spaces representing one indentation level.
 */
const SPACE_AMOUNT = 2
/**
 * Regular expression to parse a single line of the pseudo tree-like string. Matches:
 * indentation, tag name, optional text, optional text type, optional text value and
 * optional attribute. Full string may look like: "  div{price:float}[id=id]".
 */
const LINE_RE =
  /^( *)?([a-zA-Z0-9_-]+|\*)(?:\{([a-z0-9_]+)(?::([a-z]+)(?::(.*))?)?\})?(?:\[([a-z0-9_-]+)=([a-z0-9_-]+?)\])? *$/
/**
 * Special constant for the jsdom emulation. The same like Node.TEXT_NODE under browser
 */
const TEXT_NODE = 3
/**
 * Two dimentional cache for score of the nodes. Contains DOM node as a first key and pseudo
 * tree-like node unique id as a second key, which contains a score. It's used to optimize
 * recursion process. If score of cached sub-tree is lower than maxScore there is no sense to
 * traverse into this sub-node and we may skip it. Ex: const score = SCORE_CACHE.get(el).get(id).
 */
const SCORE_CACHE = new Map()
/**
 * Cache for tag names. Uses DOM element as a key and tagName property as a value.
 */
const TAG_NAME_CACHE = new Map()
/**
 * Cache for tags text. Uses DOM element as a key and tag text as a value.
 */
const TEXT_CACHE = new Map()
/**
 * Cache for el.firstElementChild elements. Uses element as a key and firstElementChild as a value.
 */
const FIRST_CHILD_CACHE = new Map()
/**
 * Cache for el.nextElementSibling elements. Uses element as a key and nextElementSibling as a value.
 */
const NEXT_CACHE = new Map()
/**
 * Global identifier for pseudo tree-like nodes. Every node obtains id++ as unique identifier.
 * This variable should be reset before every usege (before toTree() call).
 */
let id = 0
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
 * Full format of one line is: "  tag[textTag:textType:textVal]{attrTag=attrName}".
 * Example: "  img{text:func:checkText}[attr=href]"
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
    // 1: spaces, 2: tag, 3: textTag, 4: text type, 5: text value, 6: attrTag, 7: attrName
    const m = line.match(LINE_RE)
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
    if (m[6] && !m[7]) {
      logErr(line, i, `Wrong attribute format. Should be [attrTag=attrName]`)
      continue
    }
    if (curLevel === level) {
      const node = {id: id++, tag : m[2].toUpperCase()}
      m[3] && (node.textTag = m[3])
      m[4] && (node.textType = m[4])
      m[5] && (node.textVal = m[5])
      m[6] && (node.attrTag = [m[6], m[7]])
      nodes.push(node)
    } else if (curLevel > level) {
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
 *     *{h1}
 *     img{text}[src=src]
 * 
 * @returns {Object[]} Parsed tree structure.
 */
function toTree(tpl) {
  const lines = tpl.split('\n')
  const nodes = []
  id = 0
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
 * Checks if a string is a float number after type cast
 * @param {String} str String to check
 * @returns {Boolean}
 */
function isFloat(str) {
  const num = +str
  return !Number.isNaN(num) && !Number.isInteger(num)
}
/**
 * Checks if a string is an integer number after type cast
 * @param {String} str String to check
 * @returns {Boolean}
 */
function isInt(str) {
  return Number.isInteger(+str) && !str.includes('.')
}
/**
 * Returns a cached scope for DOM element and pseudo tree-like node id. So if we trying to 
 * calculate a score for the DOM node and all it's sub-nodes we have to check this cache first.
 * @param {Element} el DOM element
 * @param {Number} id Unique id of pseudo tree-like node
 * @returns {Number|undefined} scope or undefined
 */
function cachedScope(el, id) {
  if (SCORE_CACHE.get(el) === undefined) SCORE_CACHE.set(el, new Map())
  return SCORE_CACHE.get(el).get(id)
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
  return ''
}
/**
 * Returns all possible variants of nodes of the one level. Is used to compare all possible
 * nodes variants of pseudo tree and DOM nodes of one level. It works in a revert way to obtain
 * long subsets first and short at the end.
 * @param {Node[]} nodes Array of nodes we have create variants for
 * @returns {Nodes[][]} Array of arrays of Nodes combinations
 * 
 * @example
 * const nodes = [{id: 0, tag: '*'}, {id: 1, tag: 'span'}]
 * // returns [
 * //   [{id: 0, tag: '*'}, {id: 1, tag: 'span'}],
 * //   [{id: 1, tag: 'span'}],
 * //   [{id: 0, tag: '*'}]
 * // ]
 * const vars = subsets(nodes)
 */
function subsets(nodes) {
  if (!nodes) return []
  const len = nodes.length
  const size = 1 << len
  const result = new Array(size - 1)

  for (let i = size - 1, idx = 0; i > 0; i--) {
    const subset = []
    for (let j = 0; j < len; j++) (i & (1 << j)) && subset.push(nodes[j])
    subset.length && (result[idx++] = subset)
  }

  return result
}
/**
 * Makes a deep copy of the object or an array. This is your responsibility to pass obj 
 * parameter without circular nodes. Use skipProps for that.
 * @param {Object|Array} obj Object or array to copy
 * @returns {Object|Array} Copy of object or array
 */
function copy(obj) {
  if (Array.isArray(obj)) {
    const len = obj.length
    const cpy = new Array(len)
    for (let i = 0; i < len; i++) cpy[i] = copy(obj[i])
    return cpy
  } else if (typeof obj === 'object') {
    /**
     * We know that only objects will be copied, so we do it without additional recursion steps
     * for every object property with simple type like string, number, undefined, ...
     */
    const cpy = { id: obj.id, tag: obj.tag, el: obj.el, score: obj.score }
    // obj.text related to textTag, so we copy them together and if textTag exists
    if (obj.textTag) {
      cpy.textTag = obj.textTag
      cpy.text = obj.text
      obj.textType && (cpy.textType = obj.textType)
      obj.textVal && (cpy.textVal = obj.textVal)
    }
    // the same for attrTag and attr props
    obj.attrTag && (cpy.attrTag = [obj.attrTag[0], obj.attrTag[1]], cpy.attr = obj.attr)
    obj.children && (cpy.children = copy(obj.children))
    return cpy
  }
  return obj
}
/**
 * Recursively traverses an object or array, applying a callback to each node.
 * @param {Object|Array} obj Object or array to traverse.
 * @param {Function} cb Callback function (cb(node, key)) for every node
 */
function walk(obj, cb) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) cb(obj[i], i), walk(obj[i], cb)
  } else if (typeof obj === 'object') {
    for (const p in obj) if (p !== 'el') cb(obj[p], p), walk(obj[p], cb)
  } else cb(obj)
}
/**
 * Checks if a tag from pseudo tree-like node is similar to DOM element tag name. If a tag in a
 * pseudo tree is equal to *, then any tag is equal.
 * @param {Object} node 
 * @param {Element} el 
 * @returns {Boolean}
 */
function sameTag(node, el) {
  if (node.tag === '*') return true
  let tagName = TAG_NAME_CACHE.get(el)
  if (tagName === undefined) TAG_NAME_CACHE.set(el, tagName = el.tagName)
  return tagName === node.tag
}
/**
 * Checks if the tag's text has a type "type" and value "val". Is used for checking tag's text
 * for the specified type. For example: str, int, float, func,... If user sets "func" type it 
 * means this function should be defined in a global context (window under browser and self
 * under Node.js).
 * @param {String} text Text we are checking
 * @param {String} type str, int, float,... 
 * @param {String} val Additional parameter for type. For example for the func type we provide 
 * custom function name to call
 * @returns {Boolean}
 */
function sameType(text, type, val) {
  switch (type) {
    case 'str'   : return true
    case 'int'   : return isInt(text)
    case 'float' : return isFloat(text)
    case 'inside': return text.includes(val)
    case 'func'  : return !!(typeof global === undefined ? self : global)?.[val]?.(text)
    case 'empty' : return text.trim() === ''
  }
  return false
}
/**
 * Finds all nodes in a DOM tree according to JSON tree. The starting format of one JSON node 
 * is following: {id: Number, el: Element, tag: String, textTag: String, children: []}, where:
 * id - unique identifier of the pseudo node, el - reference to DOM element, tag - name of the
 * HTML tag we are looking for or *, score - score of the current node (+1 if tag exist or *, +1 
 * if textTag is not empty and HTML element also contains a text in it), text - text from HTML
 * tag, textTag - name of the text alias (will be used later for creating data map), children
 * - an array of the same nodes to support recursion search, attrTag - an array of two elements
 * with name of the attribute tag and name of the attribute of the DOM element. After all nodes
 * will be found "score" and "text" properties will be added into the result nodes. The minimum
 * node contains only "tag" property. Also, there are optional properties: textType and textVal.
 * They are used if we need to specify concrete type of the data we are looking for. For example
 * it may be a float number or integer or even an empty string. This function uses fuzzy trees
 * comparison and don't violate sequence of nodes on the same level. So if we are looking for
 * span, div, h1 on one level their order is important. It's possible to have tags between them,
 * but div is always stays after span and h1 is always after div and span.
 * 
 * @param {Object} parentTpl Parent node of the children we are comparing
 * @param {Element} parentEl Assocoated with parentTpl node element in a DOM
 * @param {Number} level Current level during compare
 * @param {Number} maxLevel Max level we may go to
 * @returns [score, Nodes[]|undefined]
 */
function match(parentTpl, parentEl, rootEl, level, maxLevel) {
  if (!parentTpl || !parentEl) return [0, undefined]
  const tplNodes = parentTpl.children
  if (!tplNodes) return [0, undefined]
  let firstEl = FIRST_CHILD_CACHE.get(parentEl)
  if (firstEl === undefined) FIRST_CHILD_CACHE.set(parentEl, firstEl = parentEl.firstElementChild)
  if (!firstEl) return [0, undefined]
  let maxScore = 0
  let maxNodes
  if (level < maxLevel) {
    /**
     * First, we check similar nodes in one level upper without combinations. This variant
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
    if (upParent && parentEl !== rootEl) {
      /**
       * Optimization logic: we have to skip nodes with lower score, because other node is
       * better than current.
       */
      const score = cachedScope(upParent, parentTpl.id)
      if (score === undefined || score > maxScore) {
        const newLevel = Math.round(level * TREE_COMPLETE_COEF) || 1
        const [upScore, upNodes] = match(parentTpl, upParent,  rootEl, newLevel, maxLevel)
        if (upScore - 1 > maxScore && upNodes) {
          maxScore = upScore - 1
          if (score === undefined && parentTpl.id !== undefined) {
            SCORE_CACHE.get(upParent).set(parentTpl.id, maxScore)
          }
          maxNodes = upNodes
        }
      }
    }
    /**
     * Second, we check similar nodes in a one level deeper without combinations. This variant
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
    if (!tplNodes?.length) return [maxScore, maxNodes]
    let el = firstEl
    while (el) {
      let firstChild = FIRST_CHILD_CACHE.get(el)
      if (firstChild === undefined) FIRST_CHILD_CACHE.set(el, firstChild = el.firstElementChild)
      if (firstChild) {
        /**
         * Optimization logic: we have to skip nodes with lower score, because other node is
         * better than current.
         */
        const score = cachedScope(el, parentTpl.id)
        if (score === undefined || score > maxScore) {
          const newLevel = Math.round(level * TREE_COMPLETE_COEF) || 1
          const [deepScore, deepNodes] = match(parentTpl, el, rootEl, newLevel, maxLevel)
          if (deepScore - 1 > maxScore && deepNodes) {
            maxScore = deepScore - 1
            if (score === undefined && parentTpl.id !== undefined) {
              SCORE_CACHE.get(el).set(parentTpl.id, maxScore)
            }
            maxNodes = deepNodes
          }
        }
      }
      let nextEl = NEXT_CACHE.get(el)
      if (nextEl === undefined) NEXT_CACHE.set(el, el = el.nextElementSibling)
      else el = nextEl
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
  if (!tplNodes?.length) return [maxScore, maxNodes]
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
        if (sameTag(node, el)) {
          node.score++
          if (node.textTag) {
            let t = TEXT_CACHE.get(el)
            if (t === undefined) TEXT_CACHE.set(el, t = text(el))
            t && (node.text = t, node.score++)
            if (node.textType && sameType(t, node.textType, node.textVal)) {
              node.score += 2
              node.text = t
            }
          }
          if (node.attrTag) {
            const a = el.getAttribute(node.attrTag[1])
            a && (node.attr = a) && node.score++
          }
        }
        // Here we go deeper and check inner nodes
        let firstChild = FIRST_CHILD_CACHE.get(el)
        if (firstChild === undefined) FIRST_CHILD_CACHE.set(el, firstChild = el.firstElementChild)
        if (firstChild) {
          const score = node.score
          if (node.children) {
            match(node, el, rootEl, Math.round(level * TREE_COMPLETE_COEF) || 1, maxLevel)
            if (node.id !== undefined && cachedScope(el, node.id) === undefined) {
              SCORE_CACHE.get(el).set(node.id, node.score)
            }
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
      // skip all text nodes using nextElementSibling
      const curEl = comb[i]?.el || el
      let nextEl = NEXT_CACHE.get(curEl)
      if (nextEl === undefined) NEXT_CACHE.set(curEl, nextEl = curEl?.nextElementSibling)
      comb[i].el = nextEl
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
  let depth = 0
  walk(tplNodes, d => {
    if (d?.tag) tplScore++, depth++ 
    d.textTag && tplScore++
    d.textType && (tplScore += 2)
    d.attrTag && tplScore++
  })
  depth > MAX_DEPTH && console.warn(`Max depth ${MAX_DEPTH} is reached. Current depth: ${depth}.`)
  if (!firstEl) return [{}, tplScore, 0, []]
  const parentNode = firstEl.parentNode
  SCORE_CACHE.clear()
  TAG_NAME_CACHE.clear()
  FIRST_CHILD_CACHE.clear()
  NEXT_CACHE.clear()
  TEXT_CACHE.clear()
  const [score, nodes] = match(tplNodes, parentNode, parentNode, 0, depth)
  const map = {}
  walk(nodes, d => {
    if (!isObj(d)) return
    if (d.textTag && d.text !== undefined) {
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

if (typeof module === 'object' && typeof module.exports === 'object') module.exports = {toTree, harvest}