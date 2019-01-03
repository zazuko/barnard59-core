const Transform = require('readable-stream').Transform

export default class Logger extends Transform {
  constructor (node) {
    super({
      objectMode: true
    })

    this.node = node.term.value
  }

  debug (message) {
    this.push({
      stack: [this.node],
      level: 'DEBUG',
      message
    })
  }

  info (message) {
    this.push({
      stack: [this.node],
      level: 'INFO',
      message
    })
  }

  _transform (chunk, encoding, next) {
    chunk.stack.push(this.node)
    this.push(chunk)
    next()
  }
}
