const run = require('../../lib/run')

module.exports = async function (pipe, out = '', appendChunk = null) {
  appendChunk = appendChunk || function (chunk, result) {
    result += chunk
  }

  pipe.on('data', (chunk) => appendChunk(chunk, out))

  await run(pipe)

  return out
}
