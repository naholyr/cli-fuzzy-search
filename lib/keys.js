'use strict'

// Key codes (that will be the crappy part to maintain)
const keys = {
	end: [
		'\u0003', // CTRL+C
		'\u0004', // CTRL+D
	],
	escape: [
		'\u001b', // ESCAPE
	],
	left: [
		'\u001b\u005b\u0044', // ←
	],
	right: [
		'\u001b\u005b\u0043', // →
	],
	up: [
		'\u001b\u005b\u0041', // ↑
	],
	down: [
		'\u001b\u005b\u0042', // ↓
	],
	pgup: [
		'\u001b\u005b\u0035\u007e', // ↑↑
	],
	pgdown: [
		'\u001b\u005b\u0036\u007e', // ↓↓
	],
	enter: [
		'\u000d', // ENTER
	],
	del: [
		'\u001b\u005b\u0033\u007e', // SUPPR
	],
	back: [
		'\u007f', // BACKSPACE
	],
}

// key: string => expected: string => boolean
module.exports = key => expected => keys[expected].includes(key)
