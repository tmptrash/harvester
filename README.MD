# Harvester

Harvester is a lightweight library for parsing pseudo-tree string representations into JSON structures and extracting matching data from DOM elements.

## Usage

### `toTree(tpl: string): Object[]`

Converts a string representation of a tree into an array of JSON nodes.

#### Example:

```js
const { toTree } = require('./harvester')
const tpl = `
div
  span
    h1{title}
    img[img=src]
`
console.log(toTree(tpl))
```

#### Input:

```plaintext
div
  span
    h1{title}
    img[img=src]
```

#### Output:

```json
[
  {
    "tag": "div",
    "children": [
      {
        "tag": "span",
        "children": [
          {
            "tag": "h1",
            "textTag": "title"
          },
          {
            "tag": "img",
            "attrTag": ["img", "src"]
          }
        ]
      }
    ]
  }
]
```

---

### `harvest(tpl: string, firstEl: Element): [Map, Number, Number, Object[]]`

Finds matches between a pseudo-tree and the DOM structure, extracting text and attributes.

#### Example:

```js
const { harvest } = require('./harvester')
const tpl = `
div
  h1{title}
  span{price}
  img[img=src]
`
const result = harvest(tpl, document.querySelector('div'))
console.log(result)
```

#### Output:

```js
[
  { title: 'Product Name', price: '99.99', img: 'https://example.com/image.jpg' }, // Extracted data
  7, // Maximum possible score
  6, // Matched score
  [...] // Extracted tree with metadata
]
```

## Code Structure

- `toTree()` – Converts a pseudo-tree string into JSON.
- `harvest()` – Finds matches between a JSON tree and the DOM.
- `copy()`, `walk()` – Utility functions for traversing and copying structures.
- `match()` – Compares JSON tree nodes with DOM elements.
- `parse()` – Main parser for the pseudo-tree.

## License

MIT

