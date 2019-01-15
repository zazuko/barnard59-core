const run = require('../../lib/run')

/**
 * @callback requestCallback
 * @param {*} output
 * @param {*} chunk
 * @returns {*} chunk
 */

/**
 * Runs a pipeline and combines chunks
 *
 * @param pipe
 * @param initialValue
 * @param {requestCallback} appendChunk optional function to append to the output
 * @returns {Promise<*>}
 */
module.exports = async function (pipe, initialValue = '', appendChunk = null) {
  let returnValue = initialValue
  const stream = await pipe.getStream()

  appendChunk = appendChunk || function (chunk, current) {
    return current + chunk
  }

  stream.on('data', (chunk) => {
    returnValue = appendChunk(chunk, returnValue)
  })

  await run(stream)

  return returnValue
}
