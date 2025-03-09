# Harvester 🚜

Harvester is a lightweight and highly optimized library for extracting data from the DOM tree. It supports tag texts with specified types and attributes.

The main idea of this library is that the data you need to extract from an HTML page can be described using a text-based template. You roughly specify which tags are inside others and what data they contain. It is not necessary to know the exact structure of the HTML.

To extract data, the user needs to describe a template of the DOM branch structure from which the extraction will be performed, and then call the harvest() function with two parameters: the described template and the parent branch in the DOM where the search will begin. This library can be used both in the browser and in web scraping tools such as [Puppeteer](https://pptr.dev).

## Main concepts

### 1. Fuzzy search
The **Harvester** library implements the concept of **"fuzzy tree matching."** This means that when searching for all branches of our template in the DOM tree, some of them **might not be found** and/or **might not be in their expected positions.** Despite this, the library will attempt to find the best possible match.

#### Example Scenario  
Imagine we are looking for two tag's texts title and price with the following template:  
```js
var tpl = `
div{title}
  span{price:float}
`
```
The DOM tree **does not have to match exactly.** For example, if the DOM structure looks like this:  
```html
<div>
  Some title
  <a href="...">Link is here</a>
  <div>
    <span>123.46</span>
  </div>
</div>
```
The values **title** and **price** will **still be found,** even though the structure is not an exact match.

### 2. Score
The next concept to understand is **scores**. Scores are how this library determines how well the extracted data matches our template.  

What does this mean?  
- For each found tag in the DOM tree, the program assigns **1 point**.  
- If the required text is found, **another point** is added.  
- If the text type matches the specified type (e.g., `int` or `float`), an **extra 2 points** are given.  
- Finally, **1 more point** is awarded if the required attribute is found on the current tag.  

During the search, not everything may match exactly. For example, the tag might be different, but the text type matches, or the text might be present, but the required attribute is missing. **Harvester** will try to find the match that **accumulates the highest score**, meaning it is the closest match to our template. Essentially, **maximizing the score increases the accuracy** of finding the required information in the DOM tree.  

How does this affect `harvest()`?  
The `harvest()` function returns two types of scores:  
- **maxScore** – the maximum possible score calculated based on the given template (i.e., the best-case scenario if everything matches perfectly).  
- **score** – the actual score obtained during data extraction.  

If `score` matches `maxScore`, then we have found everything we were looking for. However, in real - world scenarios, `score` will almost always be **lower** than `maxScore`.

### 3. Template format
To describe the structure of a data template, we need to understand its format. A template consists of **lines**. For example:  

```js
var tpl = "  img{title}[attr=src]"
```  

Each line corresponds to a branch in the DOM tree. Lines can be nested within each other using spaces at the beginning of the line. In our example, there are two spaces before the `img` tag. If this tag is the first one, the initial number of spaces is interpreted as "no spaces" and is ignored. If we need to describe a nested branch, we do it like this:  

```js
var tpl = `
  img{title}[attr=src]
    div{text}
`
```  

In this example, we defined a template consisting of two tags - `img` and `div`, where `div` is inside `img`. It's important to note that if `div` is nested inside `img`, it doesn't necessarily mean it is its first child. This library implements a fuzzy data search, meaning that `div` may be deeper in the DOM tree. Also, please take a look that we are using multiline string here. The parser understands this type of string and gets only two lines instead of four. 

### 4. Understanding the format of a single line
#### spaces
As you may have noticed, every two spaces before a tag are interpreted as a "nested element." This is how we determine that the `div` tag is inside the `img` tag - since it has two more leading spaces. If you make a mistake and add more spaces than necessary, the parser will throw an error, and the current line will not be included in the final tree.  

#### tag
After the spaces, there is a required element - the tag. If we don't remember which specific tag should be in that place, we can use the special `*` symbol, which means "any tag". So in this case our template may look like this: `  *{title}[src=href]`.

#### tag's text
Next, there is an optional block for extracting text from the current tag. In the example above, we specified `{title}`. Curly brackets indicate that we are looking for text inside the `img` tag, which will be stored under the key `"title"` in the object returned by the `harvest()` function. It's important to note that only own the text of specified tag will be returned. If a tag has many text nodes, then an array will be returned.

#### tag's text types
Once again, this parameter is optional, and we can omit it if we don’t need the text of the current tag. If we know the type of data contained within the current tag, `harvester` supports several basic types:  

- `int` - an integer  
- `float` - a floating-point number  
- `with` - a substring search  
- `func` - a custom function for text validation  
- `str` - a string  
- `empty` - an empty text  

Let's look at an example of using these types. Suppose we want to find a title that contains the word "Big". The template line will look like this:  

```js
var tpl = "  img{title:with:Big}"
```  

Notice that we omitted the square brackets in this example.  

If we want to find a title inside an `img` tag that is an integer, our template will be:  

```js
var tpl = "  img{title:int}"
```  

Finally, if we are looking for something specific and have a special function to validate the title, the template will be:  

```js
var tpl = "  img{title:func:checkTitle}"
```  

In this example, `checkTitle` must exist in the global scope before calling the `harvest()` function. Like this `function checkTitle() {...}`

#### attributes
The next optional parameter is the search for a tag’s attribute value. For example, the `img` tag may have an `src` attribute, and to extract its value, we need to create the following template:  

```js
var tpl = "  img[attr=src]"
```  

In this example, the value of the `src` attribute of the `img` tag will be extracted and stored under the key `"attr"` in the object returned by the `harvest()` function.

## API

`harvest(tpl, firstEl): [data, maxScore, score, metaTree]`

Finds matches between a pseudo-tree and the DOM structure, extracting text and attributes. The only function you will use to retrieve data is harvest(). It takes two parameters: a text-based template describing the structure of the data and a DOM element corresponding to the first specified tag. The function returns an array of four elements:
- data -  A hash map containing all the extracted data, organized by the keys specified in the template.
- maxScore - The maximum possible score based on the given template.
- score - The actual score obtained based on the search for template elements.
- metaTree - A metadata tree for debugging.

## Example:

Let's imagine we have a HTML like this:
```html
<div id="product">
  <div>
    <span>Some title</span>
  </div>
  <h1>Product Name</h1>
  <span>99.99</span>
  <img src="https://example.com/image.jpg"></img>
</div>
```

And you need to grab a product title (you know that it has a "Name" in a title), price and an it's image. For this, your pseudo tree template may look like this:
```js
import { harvest } from 'harvester'
const tpl = `
*                     // finds any tag as a parent
  h1{title:with:Name} // finds h1 inside parent tag with a substring "Name" in a text
  span{price:float}   // finds a span inside parent tag with a float number as a text
  *[img=src]          // finds any tag in a perent with src attribute
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
