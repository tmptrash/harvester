# Harvester 🚜

Harvester is a lightweight and highly optimized library for parsing pseudo-tree string representations into JSON structures and efficiently extracting matching data from DOM elements.

### `harvest(tpl, firstEl): [Map, Number, Number, Object[]]`

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
  {
    title: 'Product Name',
    price: '99.99',
    img: 'https://example.com/image.jpg'
  },    // Extracted data
  7,    // Maximum possible score
  6,    // Matched score
  [...] // Extracted tree with metadata
]
```

## License

MIT

