/* globals self */
import * as esprima from 'esprima'
import VirtualWorkerFileSystem from './VirtualWorkerFileSystem'
import * as plot from './plot/plot.js'
import * as table from './table/table.js'

// self-calling function that is setting up the worker
// and clears the global scope, so that we can leave that to 'eval'
(function () {
  let worker = self
  let _postMessage = worker.postMessage.bind(worker)
  let _eval = worker.eval.bind(worker)
  let _fs = new VirtualWorkerFileSystem()

  /**
   * Reads a file from the associated (virtual) file system.
   *
   * @param {string} path
   */
  worker.readFile = function readFile (path) {
    return _fs.readFile(path)
  }

  worker.writeFile = function writeFile (path, data) {
    _fs.writeFile(path, data)
  }

  worker.addEventListener('message', e => {
    let { command, args } = e.data
    if (!args) args = []
    switch (command) {
      case 'sync': {
        _initializeFileSystem(args)
        break
      }
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
    let program
    try {
      program = esprima.parseScript(src, { range: true, loc: true, tolerant: true })
      if (program.errors.length > 0) {
        _postMessage({
          id,
          errors: program.errors
        })
      } else {
        let programBody = program.body
        let result
        if (programBody.length > 0) {
          let lastStmt = programBody[programBody.length - 1]
          let _result = _eval(src) // eslint-disable-line no-useless-call
          // Note: ommitting the return value for assignment expressions
          if (lastStmt.expression.type !== 'AssignmentExpression') {
            result = _result
          }
        }
        // TODO: remove code redundancy
        if (result instanceof Promise) {
          result.then(value => {
            _postMessage({
              id,
              value: _transformValue(value)
            })
          }).catch(error => {
            _postMessage({
              id,
              errors: [ { description: error.message } ]
            })
          })
        } else {
          _postMessage({
            id,
            value: _transformValue(result)
          })
        }
      }
    } catch (error) {
      _postMessage({
        id,
        errors: [ { description: error.message } ]
      })
    }
  }

  function _transformValue (value) {
    if (value) {
      if (value.toHTML) {
        let html = value.toHTML()
        return {
          type: 'html',
          html
        }
      } else {
        return value
      }
    }
  }

  function _initializeFileSystem (entries) {
    entries.forEach(({ path, data }) => _fs.writeFile(path, data))
    _postMessage({
      'status': 'fs-ready'
    })
  }

  // removing specific things from the global scope
  worker.postMessage = null
  worker.eval = null

  // Experimental: library extensions
  worker.plot = plot
  worker.table = table

  // let service know that the worker has been launched
  _postMessage({ status: 'ready' })
})()
