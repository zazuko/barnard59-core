const Readable = require('readable-stream').Readable
const Transform = require('readable-stream').Transform
const isWritable = require('isstream').isWritable
const run = require('./run')
const eventToPromise = require('./eventToPromise')

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

    this.runPipeline(chunk, current.getStream(), callback)
      .then(() => callback())
      .catch(err => callback(err))
  }

  async runPipeline (chunk, getStream, callback) {
    const pipeStream = await getStream

    pipeStream.on('data', chunk => this.push(chunk))
    pipeStream.on('error', cause => {
      const err = new Error(`error in forEach sub-pipeline ${this.child.node.value}`)

      err.stack += `\nCaused by: ${cause.stack}`

      callback(err)
    })

    if (!isWritable(pipeStream)) {
      return run(pipeStream)
    } else {
      const item = new ObjectToReadable(chunk)
      return eventToPromise(item.pipe(pipeStream), 'end')
    }
  }

  static create (pipeline, handleChunk) {
    return new ForEach(pipeline, this.pipeline, this.log, handleChunk)
  }
}

module.exports = ForEach.create
