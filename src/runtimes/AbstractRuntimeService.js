const INITIAL = 0
const BOOTING = 1
const RUNNING = 2
const SYNCING = 3
const READY = 4

/**
 * An abstract implementation of a RuntimeService that acts as a proxy to
 * a remote code execution service.
 *
 * Note: this service is used by StencilaCellService.
 */
export class AbstractRuntimeService {
  constructor (context) {
    this.context = context

    // state for the bootup protocol
    this.state = INITIAL
    // a promise wrapper so that requests can be queued while booting up
    // Note: this._bootup.promise is the actual Promise instance
    this._bootup = null

    // queued execution requests
    this.queue = []

    this.evalCounter = 0

    // listen for archive changes
    // TODO: this should be easier, without listening to an internal event
    context.archive.getDocument('manifest').on('document:changed:internal', this._onManifestChange, this)
  }

  _cancelExecutionRequest (request) {
    throw new Error('This method is abstract')
  }

  _boot () {
    throw new Error('This method is abstract')
  }

  _bootFinished (data) {
    // do something with the data from the boot response
    // e.g. storing a session token
    throw new Error('This method is abstract')
  }

  _sendAssets (entries) {
    throw new Error('This method is abstract')
  }

  _sendExecutionRequest (id, source) {
    throw new Error('This method is abstract')
  }

  /**
   * Request execution of a cell with a given id and source.
   *
   * This is called by StencillaCellService.
   *
   * @param {string} id the cell id
   * @param {string} src the cell's source
   * @param {function} cb a callback receiving a result object
   * ```
   *  { id, evalCounter, error, value }
   * ```
   */
  requestExecution (id, src, cb) {
    if (!this.state === READY) throw new Error('Backend is not ready.')

    // only queue a request if has not been requested already
    // Note, that replacing the old request is not a good idea,
    // as other queued requests might depend on the result
    let isQueued = this.queue.findIndex(r => r.id === id) >= 0
    if (!isQueued) {
      // automatically trigger next execution when the queue is empty
      let triggerNext = this.queue.length === 0
      this.queue.push(new ExecutionRequest(id, this.evalCounter++, src, cb))
      if (triggerNext) {
        this._triggerNextExecution()
      }
    }
  }

  /**
   * Removes all pending execution requests from the queue
   *
   * This is called by StencillaCellService.
   */
  clearQueue () {
    this.queue.length = 0
  }

  /**
   * Starts the backend initialisation protocol.
   */
  _whenBackendReady () {
    switch (this.state) {
      case INITIAL: {
        this._bootup = new WaitForBackend()
        this.state = BOOTING
        this._boot()
        return this._bootup.promise
      }
      case RUNNING: {
        this.state = SYNCING
        this._sync()
        return this._bootup.promise
      }
      default:
        // already READY or bootup going on
        return this._bootup.promise
    }
  }

  _proceedWithResponse (data) {
    // ATTENTION: this implementation assumes that a non-error response,
    // e.g. status=200, can be used as confirmation to proceed with the process.
    switch (this.state) {
      case BOOTING: {
        // do something else with the data, e.g. storing a session id
        this._bootFinished(data)
        this.state = SYNCING
        this._sync()
        break
      }
      case SYNCING: {
        this.state = READY
        this._bootup.resolve()
        break
      }
      case READY: {
        this._finishExecutionRequest(data)
        break
      }
      default: {
        console.error('Unexpected response in this state', this.state, data)
      }
    }
  }

  // called on errors in the transport layer, e.g. no connection
  _proceedWithError (e) {
    switch (this.state) {
      case BOOTING:
      case SYNCING: {
        this._bootup._reject(e)
        this._reset()
        break
      }
      case READY: {
        this._finishExecutionRequest({ error: { description: e.message } })
        this._reset()
        break
      }
    }
  }

  /**
   * Processes a response coming back from the backend.
   *
   * ```
   * {
   *   id: request id (typically the cell id),
   *   error: an error (to be specified) or undefined
   *   value: a result value (string or object to be specifed) or undefined
   * }
   * ```
   * @param {object} data
   */
  _finishExecutionRequest (data) {
    // TODO: there might be responses returned by the server
    // that need a reset
    this._running = false
    // if an error occurs the whole execution is halted
    let request = this.queue.shift()
    let response = {
      id: request.id,
      evalCounter: request.evalCounter,
      error: data.error,
      value: data.value,
      assignment: data.assignment
    }
    request.cb(response)
    if (response.error) {
      console.error('Error:', response.error)
      // clearing the queue because we do not want to continue if one cell has errored
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
        this._sendExecutionRequest(next.id, next.src)
      }
    })
  }

  _getAssetBlobsForSync () {
    let context = this.context
    let archive = context.archive
    if (archive) {
      let assets = archive.getAssetEntries()
      // TODO: we should use some filtering here
      // and we should only sync those who are dirty
      // or have not been synced yet
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

  _sync () {
    // TODO: implement some kind of timeout handling
    this._getAssetBlobsForSync().then(entries => {
      this._sendAssets(entries)
    })
  }

  _reset () {
    this.state = INITIAL
    this._bootup.reject()
    this._bootup = null
    this.clearQueue()
  }

  _onManifestChange (change) {
    if (this.state < SYNCING) return
    let needsSync = false
    for (let op of change.ops) {
      if (op.isCreate() && op.val.type === 'asset') {
        needsSync = true
        break
      }
    }
    if (needsSync) {
      this.state = Math.min(this.state, RUNNING)
    }
  }
}

// A record to store requests in a queue
class ExecutionRequest {
  constructor (cellId, evalCounter, src, cb) {
    this.id = cellId
    this.evalCounter = evalCounter
    this.src = src
    this.cb = cb
  }
}

export class WaitForBackend {
  constructor () {
    this._resolve = null
    this._reject = null
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve () {
    this._resolve(this.backend)
  }

  reject (err) {
    this._reject(err)
  }
}
