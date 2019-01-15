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

    this.runPipeline(chunk, current, callback)
      .then(() => callback())
      .catch(err => callback(err))

    current.on('data', chunk => this.push(chunk))
    current.on('error', cause => {
      const err = new Error(`error in forEach sub-pipeline ${this.child.node.value}`)

      err.stack += `\nCaused by: ${cause.stack}`

      callback(err)
    })
  }

  async runPipeline (chunk, pipeline) {
    if (this.handleChunk) {
      this.handleChunk.call(undefined, pipeline, chunk)
    }

    if (!pipeline.isWritable()) {
      return run(pipeline)
    } else {
      const item = new ObjectToReadable(chunk)
      return run(item.pipe(pipeline))
    }
  }

  static create (pipeline, handleChunk) {
    return new ForEach(pipeline, this.pipeline, this.log, handleChunk)
  }
}

module.exports = ForEach.create
