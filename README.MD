# Harvester 🚜

Harvester is a lightweight and highly optimized library for extracting data from the DOM tree. It supports tag texts and their attributes. To extract data, the user needs to describe a template of the DOM branch structure from which the extraction will be performed, and then call the harvest() function with two parameters: the described template and the parent branch in the DOM where the search will begin. This library can be used both in the browser and in web scraping tools such as Puppeteer.

### `harvest(tpl, firstEl): [data, maxScore, score, metaTree]`

Finds matches between a pseudo-tree and the DOM structure, extracting text and attributes.

#### Example:

Let's imagine we have a HTML like this:
```xml
<div id="product">
  <div>
    <span>Some title</span>
  </div>
  <h1>Product Name</h1>
  <span>99.99</span>
  <img src="https://example.com/image.jpg"></img>
</div>
```

So your code may look like this:
```js
const { harvest } = require('./harvester')
const tpl = `
*              // finds a any tag
  h1{title}    // finds h1 inside any tag with a text in it
  span{price}  // finds a span inside any tag with a text
  *[img=src]   // finds any tag with src attribute
`
const result = harvest(tpl, document.querySelector('#product'))
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
