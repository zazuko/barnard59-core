const Readable = require('readable-stream').Readable
const Transform = require('readable-stream').Transform
const run = require('./run')

class ObjectToReadable extends Readable {
  constructor (content) {
    super({
      objectMode: true,
      read: () => {}
    })

    this.push(content)
    this.push(null)
  }
}

class ForEach extends Transform {
  constructor (pipeline, master, log, handleChunk) {
    super({ objectMode: true })

    this.log = log
    this.child = pipeline
    this.master = master
    this.handleChunk = handleChunk
  }

  _transform (chunk, encoding, callback) {
    const current = this.child.clone({
      ...this.master,
      objectMode: true,
      log: this.log
    })

    if (this.handleChunk) {
      this.handleChunk.call(undefined, current, chunk)
    }

    this.runPipeline(chunk, current, callback)
      .then(() => callback())
      .catch(err => callback(err))
  }

  async runPipeline (chunk, pipeStream, callback) {
    pipeStream.on('data', chunk => this.push(chunk))
    pipeStream.on('error', cause => {
      const err = new Error(`error in forEach sub-pipeline ${this.child.node.value}`)

      err.stack += `\nCaused by: ${cause.stack}`

      callback(err)
    })

    if (!pipeStream.isWritable()) {
      return run(pipeStream)
    } else {
      const item = new ObjectToReadable(chunk)
      return run(item.pipe(pipeStream))
    }
  }

  static create (pipeline, handleChunk) {
    return new ForEach(pipeline, this.pipeline, this.log, handleChunk)
  }
}

module.exports = ForEach.create
