'use strict'

const main = require('./lib/main')

module.exports = (options = {}) => {
	const {
		stdin = process.stdin,
		size = 10,
		data = null,
		debug = false
	} = options

	if (typeof data !== 'function') {
		return Promise.reject('Required option "data": function')
	}

	return main(stdin, data, size, debug)
}
