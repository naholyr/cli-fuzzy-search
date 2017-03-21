# CLI Fuzzy Search

* Asynchronous data source
* Based on `draftlog` for dynamic output
* Fuzzy-matching

![](./screen.gif)

## Usage: as a module

Install as usually with ``npm install --save cli-fuzzy-search`` or ``yarn add cli-fuzzy-search``.

```js
const search = require('cli-fuzzy-search')

const options = {
	stdin: process.stdin, // User input stream, must be a tty.ReadStream
	size: 10, // Number of shown results
	data: promisedDataset // A function returning promise of data
}

search(options) // Promise of selected result
```

The only mandatory option is ``data``, the whole (or promise of) dataset.

User will be provided a list of suggestions depending on his input. When he presses ENTER, the promise returned by ``search`` is resolved with selected item.

* dataset must be an array of objects, each one with at least a `label` key
* the final item is a copy of dataset's item, with additional properties: `highlight` (fuzzy-matching highlighted characters) and `index` (position, starting at 1, in the filtered list)

## Usage: command-line

It's mainly for demo purpose but I guess you could find some use.

Install with ``npm install -g cli-fuzzy-search`` (or ``yarn global add cli-fuzzy-search``).

```sh
search-json <path to file> [nb shown results]
```

Your JSON file must be an array of objects, each one with at least a `label` key, see [sample file](./data.json) in this repository.
