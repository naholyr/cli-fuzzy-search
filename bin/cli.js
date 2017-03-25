#!/usr/bin/env node

'use strict'

const path = require('path')

require('draftlog').into(console)


const data = require(path.resolve(process.argv[2]))
const size = Number(process.argv[3]) || undefined
const debug = !!process.env.DEBUG

require('../lib/main')({ data, size, debug })
.then(selected => {
	console.log(JSON.stringify(selected))
	process.exit(0)
})
.catch(err => {
	console.error('Error:', err)
	process.exit(1)
})
