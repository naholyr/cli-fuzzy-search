'use strict'

// string: string, chars: [character] => { match: boolean, highlight: [number] }
const fuzzy = (string, chars) => {
	const haystack = string.toLowerCase()
	let highlight = []
	const match = null !== chars.reduce((prevIndex, char) => {
		if (prevIndex === null) {
			return null
		}
		const needle = char.toLowerCase()
		const index = haystack.indexOf(needle, prevIndex)
		if (index !== -1) {
			highlight.push(index)
			return index + 1
		} else {
			return null
		}
	}, 0)
	return { match, highlight }
}

// [{ …, label: string }], [ character ] => [{ …, label: string, highlight: [number], index: number }]
module.exports = (data, chars) => {
	const results = (chars && chars.length)
		? data
			.map(item => {
				const { match, highlight } = fuzzy(item.label, chars)
				return match ? Object.assign({ highlight }, item) : null
			})
			.filter(item => item !== null)
		: data
	return results.map((item, i) => Object.assign(item, { index: i + 1 }))
}
