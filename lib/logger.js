const Transform = require('readable-stream').Transform

const levels = [ 'trace', 'debug', 'info', 'warn', 'error', 'fatal' ]

class Logger extends Transform {
  constructor (node) {
    super({
      objectMode: true
    })

    this.node = node.term.value
  }

  writeLog (level, message) {
    this.push({
      stack: [this.node],
      level: level.toUpperCase(),
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
  Logger.prototype[lvl] = function (message) {
    this.writeLog(lvl, message)
  }
})

module.exports = Logger
