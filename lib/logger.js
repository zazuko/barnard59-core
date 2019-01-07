const Transform = require('readable-stream').Transform

const levels = [ 'trace', 'debug', 'info', 'warn', 'error', 'fatal' ]

class Logger extends Transform {
  constructor (node, { master } = {}) {
    super({
      objectMode: true
    })

    this.node = node.term.value
    if (master) {
      this.pipe(master)
    }
  }

  writeLog (level, message, details = {}) {
    this.push({
      stack: [this.node],
      level: level.toUpperCase(),
      details: details,
      message
    })
  }

  _transform (chunk, encoding, next) {
    chunk.stack.push(this.node)
    this.push(chunk)
    next()
  }
}

levels.forEach((lvl) => {
  Logger.prototype[lvl] = function (message, details) {
    this.writeLog(lvl, message, details)
  }
})

module.exports = Logger
