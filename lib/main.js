'use strict'

const chalk = require('chalk')
const userInput = require('./input')
const search = require('./search')

require('draftlog').into(console)


// stdin: tty.ReadStream, data: () => Promise([{ …, label }]), nbOutputs: number, debug: boolean => Promise({ …, label, highlight, index })
module.exports = (stdin, data, nbOutputs = 10, debug = false) => new Promise((resolve, reject) => {
	// Ensure promise
	data = Promise.resolve(data)

	// Updateable display
	const updateInput = console.draft()
	const updateOutputs = ' '.repeat(nbOutputs).split('').map(() => console.draft())
	const updateStatus = console.draft()

	// Show loading status
	updateInput(chalk.dim('Enter your search'))
	updateOutputs[0]('Loading…')

	// Listen to user updateInput
	stdin.setRawMode(true)
	stdin.resume()
	stdin.setEncoding('utf8')

	let dataset = null
	let found = []
	let terms = []
	let line = 0
	let start = 0

	// Load dataset
	data.then(items => {
		if (!Array.isArray(items)) {
			end(new Error('Invalid dataset: not an array'))
		}
		// Cleanup data
		dataset = items.filter(item => item && item.label)
		updateResults()
	})

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
			updateResults()
		}
	}

	const updateResults = () => {
		if (!dataset) {
			// Not ready yet
			return
		}
		found = search(dataset, terms)
		const count = found.length
		updateStatus(chalk.bold(count + ' result(s)'))
		const results = found.slice(start, start + nbOutputs)
		const indent = String(count).length
		results.forEach((result, index) => {
			const prefix = chalk.dim(' '.repeat(indent - String(result.index).length) + result.index + ' > ')
			const title = formatFuzzyResult(result)
			const string = prefix + title
			updateOutputs[index](result.index === line + 1 ? chalk.inverse(string) : string)
		})
		for (let i = results.length; i < nbOutputs; i++) {
			updateOutputs[i]('')
		}
	}

	const onChangeLine = (dline, dpage) => {
		line = Math.max(0, Math.min(found.length - 1, line + dline + dpage * nbOutputs))
		// up
		if ((dline < 0 || dpage < 0) && line < start) {
			start = line
		}
		// down
		else if ((dline > 0 || dpage > 0) && line >= start + nbOutputs) {
			start = line - nbOutputs + 1
		}
		updateResults()
	}

	const onSelect = () => {
		const selected = found[line]
		end(null, selected)
	}

	const end = (err, result) => {
		input.removeListener('change', onChangeInput)
		input.removeListener('line', onChangeLine)
		input.removeListener('select', onSelect)
		input.removeListener('end', onEnd)
		if (err) {
			reject(err)
		} else {
			resolve(result)
		}
	}

	const onEnd = () => end()

	stdin.on('error', end)

	const input = userInput(stdin, debug)
		.on('change', onChangeInput)
		.on('line', onChangeLine)
		.on('select', onSelect)
		.on('end', onEnd)
})

// label: string, highlight: [number] => string
const formatFuzzyResult = ({ label, highlight = [] }) => label.split('').map((c, i) => highlight.includes(i) ? chalk.underline(c) : c).join('')
