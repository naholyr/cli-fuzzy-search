'use strict'

const isKey = require('./keys')
const EventEmitter = require('events')


// Watch user input and trigger callbacks
module.exports = (stdin, debug = false) => {
	const e = new EventEmitter()

	const showKey = debugKey(debug)
	let chars = []
	let position = 0
	stdin.on('data', key => {
		showKey(key)
		const is = isKey(key)
		let modified = false
		if (is('end')) {
			e.emit('end')
		} else if (is('escape')) {
			chars = []
			position = 0
			modified = true
		} else if (is('left')) {
			position = Math.max(0, position - 1)
			modified = true
		} else if (is('right')) {
			position = Math.min(chars.length, position + 1)
			modified = true
		} else if (is('up')) {
			e.emit('line', -1, 0)
		} else if (is('down')) {
			e.emit('line', +1, 0)
		} else if (is('pgup')) {
			e.emit('line', 0, -1)
		} else if (is('pgdown')) {
			e.emit('line', 0, +1)
		} else if (is('enter')) {
			e.emit('select')
		} else if (is('del')) {
			if (position < chars.length) {
				chars.splice(position, 1)
				modified = true
			}
		} else if (is('back')) {
			if (position > 0) {
				chars.splice(position - 1, 1)
				position = Math.max(0, position - 1)
				modified = true
			}
		} else {
			chars.splice(position, 0, key)
			position += key.length
			modified = true
		}

		if (modified) {
			e.emit('change', chars, position, modified)
		}
	})

	return e
}

const debugKey = debug => debug
	? (() => { const u = console.draft(); return key => u('~ ' + key.split('').map(c => c.charCodeAt(0).toString(16))) })()
	: () => {}
