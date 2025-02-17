# Harvester

## Overview

Harvester is a JavaScript library designed to extract structured data from a DOM tree based on a pseudo tree-like string template. It allows users to define hierarchical relationships between elements using a simple indentation-based syntax and then search for matching structures within the DOM.

## Features

- **Pseudo Tree-Like Syntax** – Define the structure of the elements you want to extract using an indentation-based format, making templates easy to read and write.
- **Recursive Parsing** – Convert a string template into a hierarchical tree representation that mirrors the DOM structure.
- **Deep DOM Traversal** – Search for matching structures in the DOM by considering both child and sibling relationships, allowing for flexible and robust matching.
- **Attribute & Text Extraction** – Capture both text content within elements and values of element attributes, providing comprehensive data retrieval.
- **Score-Based Matching** – Compare the extracted DOM structure with the expected template using a scoring system to find the best possible match, even with slight structural variations.
- **Flexible Data Extraction** – Retrieve structured data from web pages dynamically, adapting to different website layouts and content structures.

## How It Works

The library works in three main steps:

1.  **Define a template using the pseudo tree-like syntax:**

    ```
    div
      h1{title}
      span{price}
      img[img=src]
    ```

    - `div`, `h1`, `span`, `img` represent HTML tag names to be matched.
    - Indentation (two spaces) defines the hierarchical relationships.
    - `{title}`, `{price}` are text tags that extract text content and assign it to the keys `title` and `price` in the output.
    - `[img=src]` is an attribute tag that extracts the `src` attribute from the `<img>` tag and assigns it to the key `img`.

2.  **Pass the template and the first DOM element to `harvest()`:**

    ```javascript
    const tpl = `
    div
      h1{title}
      span{price}
      img[img=src]
    `;
    const [result] = harvest(tpl, document.querySelector("div"));
    console.log(result);
    ```

    The `harvest()` function takes the template string and a starting DOM element as input and initiates the data extraction process.

3.  **Receive structured data as an object:**

    The `harvest()` function returns an array, where the first element is a structured JavaScript object containing the extracted data:

    ```javascript
    {
      "title": "Product Name",
      "price": "$19.99",
      "img": "https://example.com/image.jpg"
    }
    ```
    This object maps the text and attribute tags defined in your template to the corresponding data found in the DOM.

## Core Functions

- **`toTree(tpl: string): Object[]`** – Converts a pseudo tree-like string into a structured tree representation, parsing the template syntax and hierarchy.
- **`harvest(tpl: string, firstNodeEl: Element): [Object, number, number, Array]`** – The main function that orchestrates data extraction from the DOM based on the provided template and starting DOM element. Returns an array containing:
    -  Structured data map (Object).
    -  Maximum possible score.
    -  Score of the found tree.
    -  Array of found nodes with metadata.
- **`find(nodes: Array, first: Element): [number, Array]`** – Recursively finds all possible matches in the DOM for the given tree structure defined by `nodes`, starting the search from the `first` DOM Element. Returns the best score and the array of matched nodes.
- **`step(node: Node)`** – Performs a single step in the tree comparison process, evaluating the match of a template node against a DOM element and calculating a score.
- **`variants(nodes: Node[]): Node[][]`** – Generates all possible subsets (variants) of nodes from a given array, used to explore different matching combinations during the fuzzy matching process.
- **`copy(obj: Object|Array, skipProps: Object): Object|Array`** – Creates a deep copy of an object or array, optionally skipping specified properties during the copy process.
- **`traverse(obj: Object|Array, cb: Function, skipProps: Object)`** – Recursively traverses an object or array, applying a callback function (`cb`) to each node, and optionally skipping specified properties during traversal.
- **`text(el: Element): string | undefined`** – Retrieves the first direct text content of a DOM element, ignoring any nested elements within it. Returns the text content or `undefined` if no text node is found directly under the element.
- **`isObj(val: any): boolean`** – Checks if a given value is a non-null JavaScript object (not an array and not `null`). Returns `true` if it is an object, `false` otherwise.

## Use Cases

- **Web Scraping** – Efficiently extract data from websites, even with variations in HTML structure, without writing complex and brittle CSS selectors or XPath queries.
- **Automated Testing** – Validate the structure and content of web page elements in automated tests by comparing the actual DOM structure against expected templates.
- **Template Matching** – Identify specific structural patterns within HTML documents for various analysis or processing tasks.
- **Data Extraction** – Convert unstructured or semi-structured web content into clean, structured JSON data for further use in applications or data analysis pipelines.

## Conclusion

Harvester is a powerful and flexible JavaScript tool for structured data extraction from web pages. Its intuitive pseudo tree-like syntax and fuzzy matching capabilities simplify the process of navigating and parsing the DOM, making it an excellent choice for automation tasks, web scraping, and content analysis.
