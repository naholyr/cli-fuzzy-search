# CLI Fuzzy Search

* Asynchronous data source
* Based on `draftlog` for dynamic output
* Fuzzy-matching

![](./screen.gif)

## Usage: as a module

Install as usually with ``npm install --save cli-fuzzy-search`` or ``yarn add cli-fuzzy-search``.

Most basic usage is with a fully loaded data-source and default options:

```js
const search = require('cli-fuzzy-search')

const options = { data: myDataset }

search(options)
.then(item => …)
.catch(err => …)
```

### Options

```js
{
	stdin: process.stdin,   // User input stream, must be a tty.ReadStream
	size: 10,               // Number of shown results
	debounceDelay: 300,     // Delay between last keystroke and actually filtering results

	data: promisedDataset,  // Promise([ { label, … } ])

	// or

	search: searchFunction, // (q: String, page: Number) => Promise({ more: Boolean, total: Number, data: Array })
	fuzzyOnSearch: false,   // Apply fuzzy filter on dataset returned by search(), if your search results really suck
	cache: true             // Cache previous search results in memory
}
```

You must provide `data` or `search`:

* `data`: the whole (or promise of) dataset, an array of objects with following properties:
  * `label`: the string showed in list
  * any other property will be kept as-is
* `search`: a function for asynchronous paginated search results:
  * this function will be called each time user changes input
  * it will be called with two parameters:
    * the string typed by user
    * the requested page (starting at 1)
  * this function is expected to return a promise of an object with following properties:
    * `more`: if true it means there are more pages, so when user reaches the end of the list the function will be called again with incremented page number to fetch the rest (until `hasMore` is falsy)
    * `total`: total number of results
    * `data`: the dataset, see above

The eventually returned item is a copy of dataset's item. If fuzzy filter was applied, additional properties will be added:

  * `highlight`: fuzzy-matching highlighted characters
  * `index`: position (starting at 0) in the filtered list

See sample usages in [samples folder](./samples/).

## Usage: command-line

It's mainly for demo purpose but I guess you could find some use.

Install with ``npm install -g cli-fuzzy-search`` (or ``yarn global add cli-fuzzy-search``).

```sh
search-json <path to file> [nb shown results]
```

Your JSON file must be an array of objects, each one with at least a `label` key, see [sample file](./samples/data.json) in this repository.
