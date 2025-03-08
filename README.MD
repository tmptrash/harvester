# Harvester 🚜

Harvester is a lightweight and highly optimized library for extracting data from the DOM tree. It supports tag texts with specified types and attributes.

The main idea of this library is that the data you need to extract from an HTML page can be described using a text-based template. You roughly specify which tags are inside others and what data they contain. It is not necessary to know the exact structure of the HTML.

To extract data, the user needs to describe a template of the DOM branch structure from which the extraction will be performed, and then call the harvest() function with two parameters: the described template and the parent branch in the DOM where the search will begin. This library can be used both in the browser and in web scraping tools such as [Puppeteer](https://pptr.dev).

## Main concepts
To describe the structure of a data template, we need to understand its format. A template consists of lines. For example:  

```js
var tpl = "  img{title}[src=href]"
```  

Each line corresponds to a branch in the DOM tree. Lines can be nested within each other using spaces at the beginning of the line. In our example, there are two spaces before the `img` tag. If this tag is the first one, the initial number of spaces is interpreted as "no spaces" and is ignored. If we need to describe a nested branch, we do it like this:  

```js
var tpl = `
  img{title}[src=href]
    div{text}
`
```  

In this example, we defined a template consisting of two tags - `img` and `div`, where `div` is inside `img`. It's important to note that if `div` is nested inside `img`, it doesn't necessarily mean it is its first child. This library implements a fuzzy data search, meaning that `div` may be deeper in the DOM tree. Also, please take a look that we are using multiline string here. The parser understands this type of string and gets only two lines instead of four. 

### Understanding the format of a single line  
As you may have noticed, every two spaces before a tag are interpreted as a "nested element." This is how we determine that the `div` tag is inside the `img` tag - since it has two more leading spaces. If you make a mistake and add more spaces than necessary, the parser will throw an error, and the current line will not be included in the final tree.  

After the spaces, there is a required element—the tag. If we don't remember which specific tag should be in that place, we can use the special `*` symbol, which means "any tag". So in this case our template may look like this: `  *{title}[src=href]`.

Next, there is an optional block for extracting text from the current tag. In the example above, we specified `{title}`. Curly brackets indicate that we are looking for text inside the `img` tag, which will be stored under the key `"title"` in the object returned by the `harvest()` function.  

Once again, this parameter is optional, and we can omit it if we don’t need the text of the current tag. If we know the type of data contained within the current tag, `harvester` supports several basic types:  

- `int` – an integer  
- `float` – a floating-point number  
- `with` – a substring search  
- `func` – a custom function for text validation  
- `str` – a string  
- `empty` – an empty text  

Let's look at an example of using these types. Suppose we want to find a title that contains the word "Big." The template line will look like this:  

```
  img{title:with:Big}
```  

Notice that we omitted the square brackets in this example.  

If we want to find a title inside an `img` tag that is an integer, our template will be:  

```
  img{title:int}
```  

Finally, if we are looking for something specific and have a special function to validate the title, the template will be:  

```
  img{title:func:checkTitle}
```  

In this example, `checkTitle` must exist in the global scope before calling the `harvest()` function.

## API

`harvest(tpl, firstEl): [data, maxScore, score, metaTree]`

Finds matches between a pseudo-tree and the DOM structure, extracting text and attributes. The only function you will use to retrieve data is harvest(). It takes two parameters: a text-based template describing the structure of the data and a DOM element corresponding to the first specified tag. The function returns an array of four elements:
- data -  A hash map containing all the extracted data, organized by the keys specified in the template.
- maxScore - The maximum possible score based on the given template.
- score - The actual score obtained based on the search for template elements.
- metaTree - A metadata tree for debugging.

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
