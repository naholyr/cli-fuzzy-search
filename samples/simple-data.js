'use strict'

const prompt = require('../')
const data = require('./data.json')

console.log('Data is directly an array of items')

prompt({ data })
.then(item => {
	console.log('Selected item:', item)
	process.exit(0)
})
.catch(e => {
	console.error('Error:', e)
	process.exit(1)
})
