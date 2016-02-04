'use strict'

const util = require('util')

class LoggingLogger {
  constructor () {
    this.calls = []
  }

  log (template) {
    const args = Array.prototype.slice.call(arguments)
    this.calls.push(util.format.apply(null, args))
  }
}

module.exports = LoggingLogger
