# Harvester 🚜

Harvester is a lightweight and highly optimized library for extracting data from the DOM tree. It supports tag texts with specified types and attributes.

The main idea of this library is that the data you need to extract from an HTML page can be described using a text-based template. You roughly specify which tags are inside others and what data they contain. It is not necessary to know the exact structure of the HTML.

This library is also especially useful for HTML structures that lack clear identifiers, unique classes, or other stable anchors typically used in CSS selectors.

To extract data, the user needs to describe a template of the DOM branch structure from which the extraction will be performed, and then call the harvest() function with two parameters: the described template and the parent branch in the DOM where the search will begin. This library can be used both in the browser and in web scraping tools such as [Puppeteer](https://pptr.dev).

## How to use in browser
Let's imagine you want to extract product data, and the structure of that data is shown on the left in two variations. It may change depending on different factors, such as the user's role, time zone, etc. In the top-right corner, you can see a template that describes both data structures for the given HTML examples. At the bottom-right, you can see the result that the user will get after calling the `harvest()` function.

![How to use in browser](https://github.com/tmptrash/harvester/blob/main/screenshots/scr.png)

## How to use with puppeteer
This library works perfectly in combination with [Puppeteer](https://pptr.dev). Here's a minimal example where we extract all today's news from the Ukrainska Pravda website.

```javascript
import { harvest } from 'js-harvester'
import { connect } from 'puppeteer-real-browser'

const HARVESTER_PATH = './node_modules/js-harvester/index.js'
const TPL = `
  div{time}
  div
    a{title}`

async function goto(page, fn) {
  return Promise.all([
    page.waitForNavigation({waitUntil: ['domcontentloaded', 'networkidle2']}),
    fn?.()
  ])
}
async function open() {
  const { page } = await connect({headless: false, args: ["--start-maximized"]})
  await page.setViewport(null)
  return page
}

const page = await open()
await goto(page, async () => page.goto('https://www.pravda.com.ua/news/'))
await page.addScriptTag({path: HARVESTER_PATH})

const news = await page.evaluate(tpl => {
  const newsEls = document.querySelectorAll('.container_sub_news_list div.article_news_list')
  const newsData = []
  for (let i = 0; i < newsEls.length; i++) {
    const n = harvest(tpl, newsEls[i])
    n?.[0]?.title && newsData.push(n[0])
  }
  return newsData
}, TPL)

console.log(news)
console.log('\nPress Ctrl-C to stop...')
```
### Output:
```
[
  {
    time: '13:04',
    title: '"Не зможу жити, якщо не поїду разом з ними". Історія сімох рідних братів, які служать у 3 ОШБр'
  },
  {
    time: '12:44',
    title: 'Ракетний удар по Сумах: кількість поранених зросла до 83, з них 7 дітей'
  },
  { time: '12:30', title: 'Партизани спалили танк на Донеччині' },
  {
    time: '12:23',
    title: '"Б’є всі вікові рекорди": найстарішій у світі горилі виповнилося 68 років'
  },
  ...
]
```

P.S. If you want to see more examples of how this library is used, take a look at the [harvester.test.js](https://github.com/tmptrash/harvester/blob/main/harvester.test.js) file. There you'll find various template examples and the corresponding search results extracted from HTML.

## Advantages
- **Declarative and readable** – the ability to see all block data at once, along with easy-to-read templates  
- **Can find DOM nodes without identifiable elements** such as `id`, `class name`, or attributes  
- **Simplicity and minimalism** – the implemented features are enough to extract data from most websites, and the library's single function greatly simplifies its usage  
- **Resistant to DOM structure changes** – HTML may look very different for the same data, but it will still be correctly extracted  
- **Highly optimized and fast** - a typical harvest() function call completes in 15ms
- **Extracts all data at once** – you don't need to define the structure of every field or tag manually. All the data will be returned in a JS object 
- **Supports various data types** such as `int`, `float`, `func`, `empty`, and more  
- **Compatible with Puppeteer**

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
The values **title** and **price** will **still be found,** even though the structure is not an exact match. In the given HTML, only one `div` contains text, and only one `span` is inside this `div`. Moreover, the value inside the `span` is a **floating-point number**. This is exactly how the library identifies the data we need. You might ask: **What about performance?** If the DOM tree is large, the program could get stuck in deeply nested branches while trying to find the required data. To solve this problem, the **score calculation algorithm** was introduced. A DOM tree can indeed be **very large**, and if **Harvester** were to check every single branch, the process could take a long time.  

#### The Key Idea  
The **further we deviate** from the tree structure defined in our **template**, the **fewer points** we accumulate. In other words, at a certain depth, continuing the search **no longer makes sense** because the potential score **will be lower** than what we achieved in the higher levels of the DOM tree. To put it simply:  
- The **deeper** we search from the entry point, the **fewer points** we collect.  
- The **lower the score**, the **less likely** the data will be found.

### 2. Score
The next concept to understand is **score**. Score is how this library determines how well the extracted data matches our template. What does this mean?  
- For each found tag in the DOM tree, the program assigns **1 point**.  
- If the required text is found, **another point** is added.  
- If the text type matches the specified type (e.g., `int` or `float`), an **extra 2 points** are given.  
- Finally, **1 more point** is awarded if the required attribute is found on the current tag.
- If we go one level down or move one level up when nothing is found at the current level, **we take 1 point**.

#### Example
Let's assume we have the following template:  

```js
var tpl = `
div{title}
  *{price:float}
`
```

Here, we are looking for a **title** inside the text of the `div` tag and a **price** inside the text of **any** tag within the `div`, where the value must be of type `float`. To calculate the **maximum score** (`maxScore`), we need to go through all the lines of the template and sum up the points for each element:
1. If the `div` tag matches: **+1 point**  
2. If the `div` tag has text: **+1 point**  
3. If there is **any** tag inside the `div`: **+1 point**  
4. If this tag contains text of type `float`: **+2 points**  

In total, that gives **5 points**. So, `maxScore = 5`.

During the search, not everything may match exactly. For example, the tag might be different, but the text type matches, or the text might be present, but the required attribute is missing. **Harvester** will try to find the match that **accumulates the highest score**, meaning it is the closest match to our template. Essentially, **maximizing the score increases the accuracy** of finding the required information in the DOM tree.  

How does this affect `harvest()` function? The `harvest()` returns two types of scores:  
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

`harvest(tpl, firstEl, options = {}): [data, maxScore, score, metaTree]`

Finds matches between a pseudo-tree and the DOM structure, extracting text and attributes. The only function you will use to retrieve data is harvest(). It takes three parameters: a text-based template describing the structure of the data, DOM element corresponding to the first specified tag and options. The options have this format (with default values):
```js
const options = {
  completeCoef: 1.6,    // The acceleration factor at which points will decrease when descending or ascending one level in the DOM tree. It affects the search speed and accuracy (lower value = more accuracy) 
  spaceAmount: 2,       // Default amount of spaces in a template between parent and child
  executionTime: 15000, // Maximum search time. The search will be automatically stopped when the time runs out
  minDepth: 3           // Minimum depth we are doing search. This value is used to be more robust to the changed DOM structure, adding new and removing nodes
}
```

The function returns an array of four elements:
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

## Run linter
Run `standardjs` library to find possible issues in a code.
```
npm run lint
```

## Contribution
Just create an issue or PR and we will start a conversation...

## License

MIT
