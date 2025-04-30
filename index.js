/**
 * This coefficient affects level calculation. Under level I mean every recursive call of match()
 * function. For every deeper or upper jump we multiply current level into this coefficient. Like
 * this: Math.round(level * TREE_COMPLETE_COEF) || 1. Looks like I refound Fibonacci coefficient :)
 * The level affects score for every found node by this formula:
 * (node.score > 0 || score > 0) && (node.score += (score + (node.score > 0 ? maxLevel - level : 0)))
 * Also, level affects how many deeper or upper nodes will be using during search. This is also
 * optimization metric.
 */
const LEVEL_COEF = 1.61803398875
/**
 * Number of spaces representing one indentation level.
 */
const SPACE_AMOUNT = 2
/**
 * Minimum depth we are doing to search. This value is used to be more robust to the changed DOM
 * (added and removed nodes) structure
 */
const MIN_DEPTH = 3
/**
 * Amount of point we add if the tag is equal to which we are loking for
 */
const TAG_SCORE = 1
/**
 * Amount of milliseconds harvest() function may searching for the data in a DOM. When this timeout
 * is reached execution will be stopped and only found data will be returned in a map
 */
const EXECUTION_TIME = 15000
/**
 * Regular expression to parse a single line of the pseudo tree-like string. Matches:
 * indentation, tag name, optional text, optional text type, optional text value and
 * optional attribute. Full string may look like: "  div{price:float}[id=id]".
 */
const LINE_RE =
  /^( *)?([a-zA-Z0-9_-]+|\*)(?:\{([a-zA-Z0-9_]+)(?::([a-z]+)(?::(.*))?)?\})?(?:\[([a-zA-Z0-9_-]+)=([a-zA-Z0-9_-]+?)\])? *$/
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
 * Cahe for parentNode elements. Uses DOM elements as a key and parent elements as a value.
 */
const PARENT_CACHE = new Map()
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
let id = -1
/**
 * Reference to the root DOM element we start searching from. Shoould be set once before matching
 * process is started
 */
let rootEl
/**
 * Reference to the firstEl, which is passed as a second parameter to the harvester() function. We
 * need it to check if algorithm is not jumping outside the first element we started search from
 */
let rootFirstEl
/**
 * Harvester options.
 *   spaceAmount - see SPACE_AMOUNT
 *   executionTime - see EXECUTION_TIME
 *   minDepth - see MIN_DEPTH
 *   tagScore - see TAG_SCORE
 *   tagTextScore - === tagScore * minDepth * 2
 *   tagAttrScore - === tagScore * minDepth * 2
 *   tagTextTypeScore - === tagScore * minDepth * 4
 */
let options = {}
/**
 * Timestamp, when harvest() function was started to work. Is used with executionTime option
 * to calculate if we have to stop searching, becaue of executionTime timeout is reached
 */
let startTime = performance.now()
/**
 * Returns a cached score for DOM elements and pseudo tree-like nodes array. So if we trying to
 * calculate a score for the DOM nodes and all it's sub-nodes we have to check this cache first.
 * @param {Element} firstEl First DOM element we start to compare
 * @param {Number} nodesId Unique id of pseudo tree-like nodes
 * @returns {Number|undefined} score or undefined
 */
SCORE_CACHE.getScore = function getScore (firstEl, nodesId) {
  if (this.get(firstEl) === undefined) this.set(firstEl, new Map())
  return this.get(firstEl).get(nodesId)
}
/**
 * Sets score value into the cache. Score is related to DOM element and template node(s) id
 * @param {Element} firstEl First DOM element we start to compare
 * @param {String} nodesId Unique pseudo tree-like nodes id
 * @param {Number} score Score
 */
SCORE_CACHE.setScore = function setScore (firstEl, nodesId, score) {
  this.get(firstEl).set(nodesId, score)
}
/**
 * Returns tag name from a cache by DOM element
 */
TAG_NAME_CACHE.getName = function getName (el) {
  let tagName = TAG_NAME_CACHE.get(el)
  if (tagName === undefined) TAG_NAME_CACHE.set(el, tagName = el.tagName.toUpperCase())
  return tagName
}
/**
 * Returns cached text of the DOM element
 * @param {Element} el DOM element
 * @returns {String|undefined}
 */
TEXT_CACHE.getText = function getText (el) {
  let t = this.get(el)
  if (t === undefined) this.set(el, t = text(el))
  return t
}
/**
 * Returns cached parent node for DOM element "el"
 * @param {Element} el DOM element whose parent we need to get
 * @returns {Element|null}
 */
PARENT_CACHE.getParent = function getParent (el) {
  let parentEl = this.get(el)
  if (parentEl === undefined) this.set(el, parentEl = el?.parentNode)
  return parentEl
}
/**
 * Returns cached first child of DOM element "el"
 * @param {Element} el Element whose first child we need to get
 * @returns {Element|null}
 */
FIRST_CHILD_CACHE.getFirstChild = function getFirstChild (el) {
  let firstChildEl = this.get(el)
  if (firstChildEl === undefined) this.set(el, firstChildEl = el.firstElementChild)
  return firstChildEl
}
/**
 * Returns cached next sibling DOM element for "el"
 * @param {Element} el DOM Element, whose next sibling we need to get
 * @returns {Element|null}
 */
NEXT_CACHE.getNext = function getNext (el) {
  let nextEl = this.get(el)
  if (nextEl === undefined) this.set(el, nextEl = el?.nextElementSibling)
  return nextEl
}
/**
 * Creates all properties of harvester options object. Sets default values if not set
 * @param {Object} opt Options obtained from harvest() function as a parameter
 * @returns {Object} Full options object
 */
function buildOptions (opt = {}) {
  !opt.completeCoef && (opt.completeCoef = LEVEL_COEF)
  !opt.spaceAmount && (opt.spaceAmount = SPACE_AMOUNT)
  !opt.executionTime && (opt.executionTime = EXECUTION_TIME)
  !opt.minDepth && (opt.minDepth = MIN_DEPTH)
  !opt.tagScore && (opt.tagScore = TAG_SCORE)
  !opt.tagTextScore && (opt.tagTextScore = opt.tagScore * opt.minDepth * 2)
  !opt.tagAttrScore && (opt.tagAttrScore = opt.tagScore * opt.minDepth * 2)
  !opt.tagTextTypeScore && (opt.tagTextTypeScore = opt.tagScore * opt.minDepth * 4)
  options = opt
}
/**
 * Displays an error message during parsing of the pseudo tree-like string.
 * @param {String} line The current line being parsed.
 * @param {Number} l Line number.
 * @param {String} msg Error message.
 */
function err (line, l, msg) {
  console.error(`Error in line '${line}' #:${l}. ${msg}.`)
}
/**
 * Recursively converts a pseudo tree-like string into an array of nodes.
 * Invalid nodes are skipped and only valid lines will be in final JSON tree.
 * Full format of one line is: "  tag{textTag:textType:textVal}[attrTag=attrName]".
 * Example: "  img{text:func:checkText}[attr=href]"
 *
 * @param {String[]} lines The pseudo tree-like string split into lines.
 * @param {Number} l Current line index.
 * @param {Object[]} nodes Array to store parsed nodes.
 * @param {Number} level Current indentation level.
 * @param {Number} startSpaces Left padding of the first not empty tag in a tree
 * @returns {[Number, Number]} The updated line index and level difference.
 */
function parse (lines, l, nodes, level, startSpaces = -1) {
  for (let i = l; i < lines.length; i++) {
    const line = lines[i]
    if (!line || line.trim() === '') continue
    // 1: spaces, 2: tag, 3: textTag, 4: text type, 5: text value, 6: attrTag, 7: attrName
    const m = line.match(LINE_RE)
    if (!m) { err(line, i, 'Wrong line format'); continue }
    const spaces = m[1]?.length || 0
    if (spaces % options.spaceAmount !== 0) {
      err(line, i, `Wrong left indentation. Must be a multiple of ${options.spaceAmount}`)
      continue
    }
    if (startSpaces < 0) startSpaces = spaces
    if ((spaces - startSpaces) % options.spaceAmount !== 0) {
      err(line, i, `Wrong left indentation. Must be a multiple of ${options.spaceAmount}`)
      continue
    }
    const curLevel = (spaces - startSpaces) / options.spaceAmount
    if (curLevel < 0) { err(line, i, 'Wrong left indentation level'); continue }
    if (curLevel > level && curLevel - level > 1) {
      err(line, i, 'Wrong left indentation level')
      continue
    }
    if (m[6] && !m[7]) {
      err(line, i, 'Wrong attribute format. Should be [attrTag=attrName]')
      continue
    }
    if (curLevel === level) {
      const node = { id: id++, tag: m[2].toUpperCase(), maxScore: 0 }
      m[3] && (node.textTag = m[3])
      m[4] && (node.textType = m[4])
      m[5] && (node.textVal = m[5])
      m[6] && (node.attrTag = [m[6], m[7]])
      nodes.push(node)
    } else if (curLevel > level) {
      if (!nodes.length) { err(line, i, 'Wrong left indentation level'); continue }
      nodes[nodes.length - 1].children = []
      let ret
      [i, ret] = parse(lines, i, nodes[nodes.length - 1].children, level + 1, startSpaces)
      if (ret) return [i, ret - 1]
    } else return [i - 1, level - curLevel - 1]
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
function toTree (tpl) {
  const lines = tpl.toString().split('\n')
  const nodes = []
  id = 0
  parse(lines, 0, nodes, 0)
  return nodes
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
 * Checks if a value is a non-null object.
 * @param {*} val Value to check.
 * @returns {Boolean} True if val is an object, false otherwise.
 */
function isObj (val) {
  return typeof val === 'object' && !Array.isArray(val) && val !== null
}
/**
 * Checks if a string is a float number after type cast
 * @param {String} str String to check
 * @returns {Boolean}
 */
function isFloat (str) {
  const num = +str
  return str !== '' && !Number.isNaN(num) && !Number.isInteger(num)
}
/**
 * Checks if a string is an integer number after type cast
 * @param {String} str String to check
 * @returns {Boolean}
 */
function isInt (str) {
  return str !== '' && Number.isInteger(+str) && !str.includes('.')
}
/**
 * Retrieves the first direct trimmed text content of an element, skipping nested elements.
 * @param {Element} el The DOM element.
 * @returns {String|undefined} The text content or undefined if none found.
 */
function text (el) {
  if (!el) return undefined
  const texts = []
  for (const child of el.childNodes) {
    if (child.nodeType === TEXT_NODE) {
      const t = child.textContent.trim()
      t && texts.push(t)
    }
  }
  return texts.length === 1 ? texts[0] : (!texts.length ? '' : texts)
}
/**
 * Returns unique id for the array of nodes combining their ids. It takes only the nodes of one
 * level without children.
 * @param {Node[]} nodes Array of nodes
 * @returns {String} Unique id string
 */
function getNodesId (nodes) {
  return nodes.reduce((pre, cur) => pre + ((pre && '-') + cur.id), '')
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
function subsets (nodes) {
  if (!nodes) return []
  const len = nodes.length
  const size = 1 << len
  const result = new Array(size - 1)

  for (let i = size - 1, idx = 0; i > 0; i--) {
    const subset = []
    for (let j = 0; j < len; j++) (i & (1 << j)) && subset.push(nodes[j])
    result[idx++] = subset
  }

  return result
}
/**
 * Makes a deep copy of the object or an array. This is your responsibility to pass obj
 * parameter without circular nodes. We know exactly the type of object we pass, so we do
 * optimizations (decrease recursion calls) if it's an object.
 * @param {Object|Array} obj Object or array to copy
 * @returns {Object|Array} Copy of object or array
 */
function copy (obj) {
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
    const cpy = { id: obj.id, tag: obj.tag, el: obj.el, score: obj.score, maxScore: obj.maxScore }
    // obj.text related to textTag, so we copy them together and if textTag exists
    if (obj.textTag) {
      cpy.textTag = obj.textTag
      cpy.text = obj.text
      obj.textType && (cpy.textType = obj.textType)
      obj.textVal && (cpy.textVal = obj.textVal)
    }
    // the same for attrTag and attr props
    if (obj.attrTag) { cpy.attrTag = [obj.attrTag[0], obj.attrTag[1]]; cpy.attr = obj.attr }
    obj.children && (cpy.children = copy(obj.children))
    return cpy
  }
  return obj
}
/**
 * Recursively traverses an object or array, applying a callback to each node. The speed here is
 * not so important, so we call itself more times.
 * @param {Object|Array} obj Object or array to traverse.
 * @param {Function} cb Callback function (cb(node, key)) for every node.
 * @param {Function} endCb Callback, which is called at the end of walking on an object
 * @param {Number} level Recursion level
 */
function walk (obj, cb, endCb, level = 0) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) { cb(obj[i], i, level); walk(obj[i], cb, endCb, level) }
  } else if (typeof obj === 'object') {
    for (const p in obj) {
      if (p !== 'el') {
        const oldLevel = level
        level = cb(obj[p], p, level)
        walk(obj[p], cb, endCb, level)
        level = oldLevel
      }
    }
    endCb?.(obj, level)
  } else cb(obj)
}
/**
 * Checks if a tag from pseudo tree-like node is similar to DOM element tag name. If a tag in a
 * pseudo tree is equal to *, then any tag is equal. It uses cache for the tag name.
 * @param {Object} node Pseudo tree like template's node
 * @param {Element} el DOM element
 * @returns {Boolean}
 */
function sameTag (node, el) {
  if (node.tag === '*') return true
  return TAG_NAME_CACHE.getName(el) === node.tag
}
/**
 * Checks if the tag's text has a type "type" and value "val". Is used for checking tag's text
 * for the specified type. For example: str, int, float, func,... If user sets "func" type it
 * means this function should be defined in a global context (window under browser and self
 * under Node.js).
 * @param {Element} el Current DOM element we are sezrching on
 * @param {String} text Text we are checking
 * @param {String} type str, int, float,...
 * @param {String} val Additional parameter for type. For example for the func type we provide
 * custom function name to call
 * @returns {Boolean}
 */
function sameType (el, text, type, val) {
  switch (type) {
    /* eslint-disable no-multi-spaces */
    case 'int'   : return isInt(text)
    case 'float' : return isFloat(text)
    case 'with'  : return text.includes(val)
    case 'func'  : {
      const obj = typeof global === 'undefined' ? self : global // eslint-disable-line no-undef
      if (!obj) {
        console.warn(`Unknown environment. Impossible to find global or self objects to run ${val} function`)
        return false
      }
      const fn = obj[val]
      if (!fn) {
        console.warn(`Function ${val} is not found in a global context`)
        return false
      }
      return !!fn(text, el)
    }
    case 'parent': return TAG_NAME_CACHE.getName(PARENT_CACHE.getParent(el)) === val.toUpperCase()
    case 'str'   : return true
    case 'empty' : return text.trim() === ''
  }
  /* eslint-enable no-multi-spaces */
  return false
}
/**
 * This function calculates total total maxScore and maxScore for every node. maxScore is used
 * during matching to skip nodes with lower score for optimization. Global maxScore - it's a global
 * score of the root node(s).
 * @param {Node[]} tplNodes Pseudo template JSON tree
 * @returns {[Number, Number]} [depth, maxScore] maximum depth in a DOM tree we will search &
 * maxScore of the root node(s)
 */
function initTpl (tplNodes) {
  let depth = options.minDepth

  walk(tplNodes, (d, prop, level) => {
    if (!isObj(d)) return prop !== 'children' ? level : Math.round(level * options.completeCoef) || 1
    if (d?.tag) { d.maxScore += options.tagScore; depth++ }
    d.textTag && !d.textType && (d.maxScore += options.tagTextScore)
    d.textType && (d.maxScore += options.tagTextTypeScore)
    d.attrTag && (d.maxScore += options.tagAttrScore)
  })
  walk(tplNodes, (d, prop, level) => {
    if (!isObj(d)) return prop !== 'children' ? level : Math.round(level * options.completeCoef) || 1
  }, (o, level) => {
    if (o.maxScore) {
      o?.children && (o.maxScore = o.children.reduce((pre, cur) => pre + cur.maxScore, o.maxScore || 0))
      o.maxScore += (depth - level)
    }
  })
  /**
   * To calculate maxScore we have to sum all first level nodes
   */
  const maxScore = tplNodes.reduce((pre, cur) => pre + cur.maxScore, 0)

  return [depth, maxScore]
}
/**
 * Initializes match() function and it's data. Should be called before first match() call
 * @param {Element|String} firstEl DOM element we are starting search from or css query
 * @return {Element}
 */
function initMatch (firstEl) {
  firstEl = isStr(firstEl) ? document.querySelector(firstEl) : firstEl
  rootFirstEl = firstEl
  rootEl = firstEl.parentNode
  SCORE_CACHE.clear()
  TAG_NAME_CACHE.clear()
  PARENT_CACHE.clear()
  FIRST_CHILD_CACHE.clear()
  NEXT_CACHE.clear()
  TEXT_CACHE.clear()
  PARENT_CACHE.set(firstEl, rootEl)
  startTime = performance.now()
  return firstEl
}
/**
 * Finds all nodes in a DOM tree according to JSON tree. The starting format of one JSON node
 * is following: {id: Number, el: Element, tag: String, textTag: String, children: [], maxScore:
 * Number, attrTag: Array, text: String, attr: String}, where:
 *
 * id       - unique identifier of the pseudo node
 * el       - reference to DOM element
 * tag      - name of the HTML tag we are looking for or *
 * score    - found score of the current node (+1 if tag exist or *, +1 if textTag is not empty and
 * HTML element also contains a text in it)
 * text     - text grabbed from HTML tag
 * textTag  - name of the property we will put data in
 * textType - type of the tag's text we are looking for
 * textVal  - additional value. Depends on textType
 * children - an array of the same nodes to support recursion search
 * attrTag  - an array of two elements with name of the attribute tag and name of the attribute of
 * the DOM element.
 * maxScore - maxScore, calculated before search
 *
 * After all nodes will be found "score" and "text" properties will be added into the result nodes.
 * The minimum node contains only "tag" property. Also, there are optional properties: textType and
 * textVal. They are used if we need to specify concrete type of the data we are looking for. For
 * example it may be a float number or integer or even an empty string. This function uses fuzzy
 * trees comparison and don't violate sequence of nodes on the same level. So if we are looking for
 * span, div, h1 on one level their order is important. It's possible to have tags between them,
 * but div is always stays after span and h1 is always after div and span.
 *
 * @param {String} tplNodesId Unique id of an array of nodes in tplNodes parameter
 * @param {Node[]} tplNodes Array of tpl nodes we have to match
 * @param {Element} firstEl First element in a DOM associated with tplNodes[0]
 * @param {Number} level Current up or down level we are searching on
 * @param {Number} maxLevel Max level we may go to through search
 * @param {Element} extraParentEl If firstEl === null, only first recursion (going upper) has sense
 * so we put the parent into separate parameter
 * @returns {[score, Nodes[]|undefined]}
 */
function match (tplNodesId, tplNodes, firstEl, level, maxLevel, extraParentEl = null) {
  if (!tplNodes?.length || performance.now() - startTime > options.executionTime) {
    return [0, undefined]
  }
  let maxScore = 0
  let maxNodes
  if (level <= maxLevel) {
    /**
     * First, we check current nodes array in one level upper without combinations. This variant
     * is used when DOM tree has a lack of nodes between current nodes in pseudo tree and DOM
     * tree. For example (pseudo tree on the left and DOM tree on the right):
     *
     *         h1
     *         h1
     *   h1 ->   div
     *   h1
     *
     * In this example, we have to find two h1 tags of a pseudo tree in a DOM tree. Please pay
     * attention on the fact that two h1 tags in a DOM tree are on the root level and we have
     * to skip div tag in a DOM tree during search. Max possible score here is 2 and algorithm
     * returns 2 (2 h1 tags found on an upper level).
     */
    const upEl = PARENT_CACHE.getParent(firstEl) || extraParentEl
    if (upEl !== rootEl) {
      const parentEl = PARENT_CACHE.getParent(upEl)
      const firstChildEl = parentEl === rootEl ? upEl : FIRST_CHILD_CACHE.getFirstChild(parentEl)
      /**
       * Optimization logic: we have to skip nodes with lower score, because other node is
       * better than current.
       */
      const score = SCORE_CACHE.getScore(firstChildEl, tplNodesId)
      if (score === undefined || score > maxScore) {
        const newLevel = Math.round(level * options.completeCoef) || 1
        const [upScore, upNodes] = match(tplNodesId, tplNodes, firstChildEl, newLevel, maxLevel)
        if (upScore > maxScore && upNodes) {
          maxScore = upScore
          if (score === undefined && tplNodesId !== undefined && maxLevel - newLevel > options.minDepth) {
            SCORE_CACHE.setScore(firstChildEl, tplNodesId, maxScore)
          }
          maxNodes = upNodes
        }
      }
    }
    /**
     * Second, we check similar nodes in a one level deeper without combinations. This variant
     * is used when DOM tree has extra nodes between current nodes in pseudo tree. For example
     * (pseudo tree on the left and DOM tree on the right):
     *
     * h1
     * h1 -> div
     *         h1
     *         h1
     *
     * In this example, we have to find two h1 tags inside the div, but div itself should be
     * skipped. So max possible score here === 2 and algorithm should return 2 (two h1 tags found
     * inside the div tag).
     */
    let el = firstEl
    while (el) {
      const firstChildEl = FIRST_CHILD_CACHE.getFirstChild(el)
      if (firstChildEl) {
        /**
         * Optimization logic: we have to skip nodes with lower score, because other node is
         * better than current.
         */
        const score = SCORE_CACHE.getScore(firstChildEl, tplNodesId)
        if (score === undefined || score > maxScore) {
          const newLevel = Math.round(level * options.completeCoef) || 1
          const [deepScore, deepNodes] = match(tplNodesId, tplNodes, firstChildEl, newLevel, maxLevel)
          if (deepScore > maxScore && deepNodes) {
            maxScore = deepScore
            if (score === undefined && tplNodesId !== undefined && maxLevel - newLevel > options.minDepth) {
              SCORE_CACHE.setScore(firstChildEl, tplNodesId, maxScore)
            }
            maxNodes = deepNodes
          }
        }
      }
      el = el === rootFirstEl ? null : NEXT_CACHE.getNext(el)
    }
  }
  // No children in a current DOM node. No sense to search deeper
  if (!firstEl) return [maxScore, maxNodes]
  /**
   * Third, we check similar nodes on the same level with all possible combinations of pseudo
   * tree. For example if we have 2 nodes: [{tag: 'div'}, {tag: 'span'}], we will have 3
   * possible combinations with different max scores:
   *
   * 1. [{tag: 'div'}, {tag: 'span'}]  // max score 2
   * 2. [{tag: 'span'}]                // max score 1
   * 3. [{tag: 'div'}]                 // max score 1
   *
   * It picks every combination of pseudo nodes and try to find it in a DOM tree. The tree with
   * maximized score will be returned as a result.
   */
  const combinations = subsets(tplNodes)
  for (let c = 0; c < combinations.length; c++) {
    /**
     * If current maxScore is bigger than score of the next combination, it means searching
     * next combination has no sense. We have to skip it to make this matching faster.
     */
    const combRef = combinations[c]
    const combScore = combRef.reduce((pre, cur) => pre + cur.maxScore, 0)
    if (maxScore >= combScore) continue
    const comb = copy(combRef)
    let i = 0
    comb[0].el = firstEl
    while (true) {
      const node = comb[i]
      const el = node.el
      if (el) {
        node.score = 0
        // here we check tag name, tag text and attribute
        if (sameTag(node, el)) {
          node.score += options.tagScore
          if (node.textTag) {
            const t = TEXT_CACHE.getText(el)
            if (node.textType) {
              if (sameType(el, t, node.textType, node.textVal)) {
                node.score += options.tagTextTypeScore
                node.text = t
              } else { node.score -= options.tagTextTypeScore; delete node.text }
            } else if (t) { node.text = t; node.score += options.tagTextScore }
          }
          if (node.attrTag) {
            const a = el.getAttribute(node.attrTag[1])
            a && (node.attr = a) && (node.score += options.tagAttrScore)
          }
        }
        // Here we go deeper and check inner nodes
        const subNodes = node.children
        if (subNodes?.length) {
          const firstChildEl = FIRST_CHILD_CACHE.getFirstChild(el)
          const newLevel = Math.round(level * options.completeCoef) || 1
          const extraEl = !firstChildEl ? el : null
          const [score, nodes] = match(getNodesId(subNodes), subNodes, firstChildEl, newLevel, maxLevel, extraEl)
          // The condition must be > 0
          if (node.score > 0 || score > 0) node.score += (score + (node.score > 0 ? maxLevel - level : 0))
          nodes?.length && (node.children = nodes)
          const nodeId = `${node.id}`
          if (node.id !== undefined && SCORE_CACHE.getScore(el, nodeId) === undefined && maxLevel - newLevel > options.minDepth) {
            SCORE_CACHE.setScore(el, nodeId, node.score) // score for only 1 node
          }
          // The condition must be > 0
        } else if (node.score > 0) node.score += (maxLevel - level)

        // all nodes found let's check if it's a best score
        if (i >= comb.length - 1) {
          i = comb.length - 1
          const nodesScore = comb.reduce((acc, cur) => acc + cur.score || 0, 0)
          if (nodesScore > maxScore) { maxScore = nodesScore; maxNodes = copy(comb) }
          /**
           * Here we reset all children of current combination, because it's structure may
           * change. Every time we compare a new set of nodes in a current level we have to
           * start with original combination. Otherwise there is a possible issue, where
           * previous comparison may affect future compare.
           */
          comb[i].children && (comb[i].children = copy(combinations[c][i].children))
        } else i++
      } else {
        /**
         * Here we reset all children of current combination, because it's structure may
         * change. Every time we compare a new set of nodes in a current level we have to
         * start with original combination. Otherwise there is a possible issue, where
         * previous comparison may affect future compare.
         */
        i && comb.length > 1 && comb[i].children && (comb[i].children = copy(combinations[c][i].children))
        i--
        if (i < 0) break
      }
      comb[i].el = comb[i].el === rootFirstEl ? null : NEXT_CACHE.getNext(comb[i]?.el || el)
    }
  }

  return [maxScore, maxNodes]
}
/**
 * This function collects final data map, which consists of text and attribute values and checks if
 * there are errors in it
 * @param {Node[]} nodes Nodes returned by match() function with meta data inside
 * @returns {Object} Collected map
 */
function getMap (nodes) {
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

  return map
}
/**
 * Main function you should call to harvest the data from an DOM tree by template. First,
 * create a pseudo tree template like in example below. div, h1, span, img - are tag names
 * you are looking for. title, price, img - optional names of properties in a returned map,
 * where found text|attribute will be placed. 2 spaces before tags - are nesting level.
 * Difference between parent and child nodes may be only 2 spaces if we go from up to down.
 * If we go from bottom to up it may be different. This template should pass as a first
 * parameter to harvest() function. Second, firstEl - should point to the first element
 * in a DOM.
 *
 * @param {String} tpl template of pseudo tree-like string
 * @param {Element|String} firstEl Reference to the first DOM element for nodes[0] or css query
 * @param {Object|undefined} opt Harvester options
 * @returns {[map: Object, maxScore: Number, foundScore: Number, foundNodes: Array]} map -
 * JavaScript object with all text tags and attribute tags in it;maxScore - maximum score.
 * It means that found tree is identical to your pseudo tree-like template; foundScore -
 * score of found tree may be between [0..maxScore]. Shows similarity between maximum score
 * and found; foundNodes - found Array based tree with all metadata in it;
 *
 * @example
 * const tpl = `
 * div
 *   h1{title}
 *   span{price:float}
 *   img[img=href]`
 * harvest(tpl, $('div')) // [{title: 'Title', price: '12.34', img: 'http://...'}, 8, 7, [...]]
 */
function harvest (tpl, firstEl, opt = {}) {
  if (!isObj(opt)) { console.error('"opt" argument is not an object'); return [{}, 0, 0, undefined] }
  buildOptions(opt)
  const tplNodes = toTree(tpl)
  const [depth, maxScore] = initTpl(tplNodes)
  if (!firstEl) return [{}, maxScore, 0, []]
  firstEl = initMatch(firstEl)
  const [score, nodes] = match(getNodesId(tplNodes), tplNodes, firstEl, 0, depth)
  const map = getMap(nodes)

  return [map, maxScore, score, nodes]
}

if (typeof module === 'object' && typeof module.exports === 'object') module.exports = { toTree, harvest, buildOptions }
