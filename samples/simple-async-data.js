'use strict'

const prompt = require('../')

const data = new Promise(resolve => setTimeout(() => {
	resolve(require('./data.json'))
}, 3000))

console.log('Data is directly a promise of a dataset, resolved after 3 seconds')

prompt({ data })
.then(item => {
	console.log('Selected item:', item)
	process.exit(0)
})
.catch(e => {
	console.error('Error:', e)
	process.exit(1)
})
