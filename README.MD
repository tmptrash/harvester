# Harvester 🚜

Harvester is a lightweight and highly optimized library for extracting data from the DOM tree. It supports tag texts with specified types and attributes. To extract data, the user needs to describe a template of the DOM branch structure from which the extraction will be performed, and then call the harvest() function with two parameters: the described template and the parent branch in the DOM where the search will begin. This library can be used both in the browser and in web scraping tools such as [Puppeteer](https://pptr.dev).

## API

`harvest(tpl, firstEl): [data, maxScore, score, metaTree]`

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

And you need to grab a product title, price and an it's image. For this, your pseudo tree template may look like this:
```js
const { harvest } = require('./harvester')
const tpl = `
*                     // finds any tag
  h1{title:with:Name} // finds h1 inside any tag with a substring "Name"
  span{price:float}   // finds a span inside any tag with a float number
  *[img=src]          // finds any tag with src attribute
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
  11,   // Maximum possible score
  11,   // Matched score
  [...] // Extracted tree with metadata
]
```

## Run tests
```
npm i
npm test
```

## License

MIT
