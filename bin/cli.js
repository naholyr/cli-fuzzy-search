#!/usr/bin/env node

'use strict'

const path = require('path')

require('draftlog').into(console)


const promisedContent = Promise.resolve(require(path.resolve(process.argv[2])))
const data = () => promisedContent
const nbOutputs = Number(process.argv[3]) || undefined

require('../lib/main')(process.stdin, data, nbOutputs, !!process.env.DEBUG)
.then(selected => {
	console.log(JSON.stringify(selected))
	process.exit(0)
})
.catch(err => {
	console.error('Error:', err)
	process.exit(1)
})
