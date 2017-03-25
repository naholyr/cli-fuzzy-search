'use strict'

const chalk = require('chalk')
const userInput = require('./input')
const fuzzy = require('./search')
const debounce = require('lodash.debounce')

require('draftlog').into(console)


// stdin: tty.ReadStream, data: () => Promise([{ …, label }]), size: number, debug: boolean => Promise({ …, label, highlight, index })
module.exports = ({
	stdin = process.stdin,
	size = 10,
	data,
	search,
	fuzzyOnSearch = false,
	debounceDelay = 100,
	debug = false,
}) => new Promise((resolve, reject) => {

	if (!data && !search) {
		return reject(Error('Required option "data" or "search"'))
	}
	if (search && typeof search !== 'function') {
		return reject(Error('Option "search" must be a function and a ' + (typeof search) + ' was received'))
	}

	// Filter and format methods
	const filter = (data || fuzzyOnSearch) ? fuzzy : items => items
	const format = (data || fuzzyOnSearch) ? formatFuzzyResult : formatSimpleResult

	// Updateable display
	const updateInput = console.draft()
	const updateOutputs = ' '.repeat(size).split('').map(() => console.draft())
	const updateStatus = console.draft()

	// Show loading status
	updateInput(chalk.dim('Enter your search'))

	// Listen to user updateInput
	stdin.setRawMode(true)
	stdin.resume()
	stdin.setEncoding('utf8')

	// Internal state
	let dataset = null
	let found = []
	let terms = []
	let line = 0
	let start = 0
	let page = 1
	let morePages = false

	stdin.on('error', e => end(e))

	// data: Load dataset
	if (data) {
		updateStatus(chalk.dim('Loading...'))
		Promise.resolve(data)
		.then(checkDataset)
		.then(items => {
			dataset = items
			filterDataset() // We don't want any delay here
		})
		.catch(e => end(e))
	}

	// When user typed a character
	const onChangeInput = (chars, position, modified) => {
		// Update user updateInput
		let prettyChars = chars.map((char, i) => (position === i ? chalk.bold.inverse : chalk.bold)(char))
		if (position === chars.length) {
			prettyChars.push(chalk.inverse(' '))
		}
		updateInput(prettyChars.join(''))

		// Trigger search
		if (modified) {
			terms = chars
			line = 0
			start = 0
			debouncedFilterDataset() // He we do want to delay the process if user types too fast
		}
	}

	// Updates internal state by triggering actual search
	const filterDataset = () => {
		if (data && dataset) {
			found = filter(dataset, terms)
			updateList()
		} else if (search) {
			triggerSearch(1)
		}
	}

	const triggerSearch = _page => {
		updateStatus(chalk.dim('Searching...'))
		page = _page
		if (page === 1) {
			// It's a fresh search, not just a pagination search, reset cached found items
			found = []
		}
		Promise.resolve(search(terms.join(''), page))
		.then(({ data, hasMore }) => {
			// Append results
			const added = data.map((item, i) => Object.assign({}, item, { index: found.length + i + 1 }))
			found = found.concat(added)
			morePages = !!hasMore
			updateList()
		})
		.catch(end)
	}

	const debouncedFilterDataset = debounce(filterDataset, debounceDelay)

	// Juste update display after updating data
	const updateList = () => {
		const count = found.length
		updateStatus(chalk.bold(count + ' result(s)'))
		const results = found.slice(start, start + size)
		const indent = String(count).length
		results.forEach((result, index) => {
			const prefix = chalk.dim(' '.repeat(indent - String(result.index).length) + result.index + ' > ')
			const title = format(result)
			const string = prefix + title
			updateOutputs[index](result.index === line + 1 ? chalk.inverse(string) : string)
		})
		for (let i = results.length; i < size; i++) {
			updateOutputs[i]('')
		}
	}

	// When user changes position in list
	const onChangeLine = (dline, dpage) => {
		line = Math.max(0, Math.min(found.length - 1, line + dline + dpage * size))
		// up
		if ((dline < 0 || dpage < 0) && line < start) {
			start = line
		}
		// down
		else if ((dline > 0 || dpage > 0) && line >= start + size) {
			start = line - size + 1
		}
		updateList()
	}

	// When user has validated his selection
	const onSelect = () => {
		const selected = found[line]
		end(null, selected)
	}

	// Abort
	const onEnd = () => end()

	// Final callback
	const end = (err, result) => {
		input.removeAllListeners()
		if (err) {
			reject(err)
		} else {
			resolve(result)
		}
	}

	// Listen to user's input
	const input = userInput(stdin, debug)
		.on('change', onChangeInput)
		.on('line', onChangeLine)
		.on('select', onSelect)
		.on('end', onEnd)
})

// label: string, highlight: [number] => string
const formatFuzzyResult = ({ label, highlight = [] }) => label.split('').map((c, i) => highlight.includes(i) ? chalk.underline(c) : c).join('')
const formatSimpleResult = ({ label }) => label

// Ensure dataset is valid
const checkDataset = items => {
	if (!Array.isArray(items)) {
		return Promise.reject(Error('Invalid dataset: not an array'))
	}
	// Cleanup data
	return Promise.resolve(items.filter(item => item && item.label))
}
