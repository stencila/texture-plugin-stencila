/* globals self */
import * as esprima from 'esprima'

// self-calling function that is setting up the worker
// and clears the global scope, so that we can leave that to 'eval'
(function () {
  let worker = self
  let _postMessage = worker.postMessage
  let _eval = self.eval
  worker.addEventListener('message', e => {
    let { command, args } = e.data
    if (!args) args = []
    switch (command) {
      case 'executeScript': {
        executeScript(args)
        break
      }
      default: {
        throw new Error('Unkown command: ' + command)
      }
    }
  })
  function executeScript ({ id, src }) {
    // TODO: is it helpful to use esprima here?
    // 1. it could produce better readable error messages
    // 2. it could be a way to 'inspect' intermediate values
    //    e.g. in
    //    ```
    //    x = 1
    //    y = 2
    //    x + y
    //    ```
    //   evaluating the program 'line-by-line' would give the chance to 'inspect'
    //   the intermediate values `x=1` and `y=2`
    let program
    try {
      program = esprima.parseScript(src, { range: true, loc: true, tolerant: true })
      if (program.errors.length > 0) {
        _postMessage({
          errors: program.errors
        })
      } else {
        let value = _eval.call(null, src) // eslint-disable-line no-useless-call
        _postMessage({
          id,
          value
        })
      }
    } catch (error) {
      _postMessage({
        errors: [error]
      })
    }
  }

  // removing specific things from the global scope
  self.postMessage = null
  self.eval = null

  // send a message back to the owner, letting know that this worker is ready
  _postMessage({ status: 'ready' })
})()
