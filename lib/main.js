'use strict'

const chalk = require('chalk')
const userInput = require('./input')
const fuzzy = require('./fuzzy')
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

	// Prepare stdin
	stdin.setRawMode(true)
	stdin.resume()
	stdin.setEncoding('utf8')
	stdin.on('error', e => end(e))

	// Internal state
	let found = []
	let count = 0
	let terms = []
	// Current selection
	let line = 0
	let start = 0
	// Only for 'data' mode
	let dataset = null
	// Only for 'search' mode
	let loadedPages = 0
	let morePages = false

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
			debouncedFilterDataset() // He we do want to delay the process if user types too fast
		}
	}

	// Updates internal state by triggering actual search
	const filterDataset = () => {
		line = 0
		start = 0
		if (data && dataset) {
			found = filter(dataset, terms)
			count = found.length
			updateList()
		} else if (search) {
			loadedPages = 0
			found = []
			loadNextPage()
		}
	}

	// Trigger search
	const loadNextPage = () => {
		updateStatus(chalk.dim('Searching...'))
		const page = loadedPages + 1
		Promise.resolve(search(terms.join(''), page))
		.then(({ data, total, more }) => {
			const added = data.map((item, i) => Object.assign({}, item, { index: found.length + i }))
			found = found.concat(added)
			count = total
			loadedPages = page
			morePages = !!more
			updateList()
		})
		.catch(end)
	}

	const debouncedFilterDataset = debounce(filterDataset, debounceDelay)

	// Juste update display after updating data or cursor position
	const updateList = () => {
		const status = count === 0 ? 'No result' : count === 1 ? '1 result' : `${count} results`
		updateStatus(chalk.bold(status))
		const results = found.slice(start, start + size)
		const padLength = String(count).length
		results.forEach((result, index) => {
			const pad = ' '.repeat(padLength - String(result.index + 1).length)
			const prefix = chalk.dim(pad + (result.index + 1) + ' > ')
			const title = format(result)
			const string = prefix + title
			updateOutputs[index](result.index === line ? chalk.inverse(string) : string)
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
