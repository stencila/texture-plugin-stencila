/**
 * An abstract implementation of a RuntimeService that acts as a proxy to
 * a remote code execution service.
 */
export class AbstractRuntimeService {
  constructor (context) {
    this.context = context
    this.queue = []
    this.evalCounter = 0
  }

  _sendMessage (type, data) {
    throw new Error('This method is abstract.')
  }

  _whenBackendReady () {
    throw new Error('This method is abstract')
  }

  _cancelExecutionRequest (request) {
    throw new Error('This method is abstract')
  }

  /**
   * Request execution of a cell with a given id and source.
   *
   * @param {string} id the cell id
   * @param {string} src the cell's source
   * @param {function} cb a callback receiving a result object
   * ```
   *  { id, evalCounter, error, value }
   * ```
   */
  requestExecution (id, src, cb) {
    let existing = this.queue.findIndex(r => r.id === id)
    let triggerNext = this.queue.length === 0
    if (existing >= 0) {
      let request = this.queue[existing]
      this.queue.splice(existing, 1)
      // interrupt an already started execution (if that is possible at all)
      this._cancelExecutionRequest(request)
      return
    }
    this.queue.push(new ExecutionRequest(id, this.evalCounter++, src, cb))
    if (triggerNext) {
      this._triggerNextExecution()
    }
  }

  /**
   * Removes all pending execution requests from the queue
   */
  clearQueue () {
    this.queue.length = 0
  }

  _waitForBackend (backend) {
    this.waitForBackend = new WaitForBackend(backend)
    return this.waitForBackend.promise
  }

  _finishRequest (data) {
    this._running = false
    // if an error occurs the whole execution is halted
    let request = this.queue.shift()
    let response = {
      id: request.id,
      evalCounter: request.evalCounter,
      error: data.error,
      value: data.value
    }
    request.cb(response)
    if (response.error) {
      console.error('Errors:', response.error)
      // clearing the queue because we do not want to continue if one cell
      // has errored
      this.queue.length = 0
    } else if (this.queue.length > 0) {
      this._triggerNextExecution()
    }
  }

  _triggerNextExecution () {
    if (this._running) {
      throw new Error('Already running.')
    }
    this._whenBackendReady().then(() => {
      if (this.queue.length > 0) {
        let next = this.queue[0]
        this._running = true
        this._sendMessage('POST', {
          command: 'executeScript',
          args: {
            id: next.id,
            src: next.src
          }
        })
      }
    })
  }

  _getAssetBlobsForSync () {
    let context = this.context
    let archive = context.archive
    if (archive) {
      let assets = archive.getAssetEntries()
      assets = assets.filter(e => e.sync)
      return Promise.all(assets.map(a => {
        return archive.getBlob(a.path).then(data => {
          return {
            path: a.path,
            data
          }
        })
      }))
    } else {
      return Promise.resolve([])
    }
  }

  _onResponse (data) {
    if (this.waitForBackend) {
      let waitForBackend = this.waitForBackend
      // worker booting protocol: launch worker then sync assets
      if (waitForBackend.state === INIT) {
        waitForBackend.state = SYNC
        this._getAssetBlobsForSync().then(entries => {
          this._sendMessage('POST', {
            command: 'sync',
            args: entries
          })
        })
      } else if (waitForBackend.state === SYNC) {
        delete this.waitForBackend
        waitForBackend.resolve()
      }
    } else {
      this._finishRequest(data)
    }
  }

  _onError (e) {
    if (this.waitForBackend) {
      console.error('Could not start worker')
      // TODO: we could also leave the waitForBackend there
      // as a blocker for upcoming requests
      // and only remove it when a restart is explicitly asked for
      let waitForBackend = this.waitForBackend
      delete this.waitForBackend
      waitForBackend.reject(e)
    } else {
      // TODO: what to do here? should we stop the worker?
      console.error(e)
    }
  }
}

class ExecutionRequest {
  constructor (cellId, evalCounter, src, cb) {
    this.id = cellId
    this.evalCounter = evalCounter
    this.src = src
    this.cb = cb
  }
}

const INIT = 0
const SYNC = 1

export class WaitForBackend {
  constructor (backend) {
    this.state = INIT
    this.backend = backend
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  static create (backend) {
    let waitForBackend = new WaitForBackend(backend)
    return waitForBackend.promise
  }

  resolve () {
    this._resolve(this.backend)
  }

  reject (err) {
    this._reject(err)
  }
}
