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

  /**
   * Sends a (HTTP) request to the backend
   *
   * Requesting code execution:
   * ```
   * POST execute { id, source }
   * Response: { id, error, value }
   * ```
   *
   * Sending content from the DAR that should be saved in the backend's file-system
   * to allow reading and processing that content.
   * ```
   * POST sync [{ path, data }...] }
   * ```
   *
   * @param {string} type HTTP message type
   * @param {object} data tha payload send with the request
   */
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
   *
   * @param {any} backend
   */
  _waitForBackend (backend) {
    this._backendBootupSequence = new BackendBootupSequence(backend)
    return this._backendBootupSequence.promise
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
        this._sendMessage('POST', {
          command: 'execute',
          args: {
            id: next.id,
            src: next.src
          }
        })
      }
    })
  }

  /**
   * A helper that retrieves all assets from the DAR that are marked with @sync
   * TODO: we should discuss if @sync is good enough. IMO, it would be the technically
   * easiest way to denote explicitly which assets should be synchronized,
   * as opposed to guessing or sending syncing all assets. Note, that there might unneeded assets, such as images, or even videos.
   * An idea for authoring from scratch could be, that the UI suggests to enable syncing when
   * an error has occurred coming from a failed try to load the file remotely.
   * Soon we will introduce a DAR browser, where this could be managed directly.
   * For the time being, @sync needs to be added to the DAR manually.
   */
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
    // TODO: this is implementing the boot-up protocol which we need to formalize
    // ATM, it is assumed that the backend is initialized, coming back with a non-error response
    // after that files from the DAR are send over to the backend, so that these
    // are available for reading and processing
    if (this._backendBootupSequence) {
      let backendBootupSequence = this._backendBootupSequence
      // worker booting protocol: launch worker then sync assets
      if (backendBootupSequence.state === INIT) {
        backendBootupSequence.state = SYNC
        this._getAssetBlobsForSync().then(entries => {
          this._sendMessage('POST', {
            command: 'sync',
            args: entries
          })
        })
      } else if (backendBootupSequence.state === SYNC) {
        delete this._backendBootupSequence
        backendBootupSequence.resolve()
      }
    } else {
      this._finishRequest(data)
    }
  }

  _onError (e) {
    if (this._backendBootupSequence) {
      console.error('Could not start worker')
      // TODO: we could also leave the waitForBackend there
      // as a blocker for upcoming requests
      // and only remove it when a restart is explicitly asked for
      let waitForBackend = this._backendBootupSequence
      delete this._backendBootupSequence
      waitForBackend.reject(e)
    } else {
      // TODO: what to do here? should we stop the worker?
      console.error(e)
    }
  }

  _isBootingBackend () {
    return Boolean(this._backendBootupSequence)
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

const INIT = 0
const SYNC = 1

// one place to manage booting up the backend
// if the runtime service is requested another time
// during bootup, the same Promise is returned as the first time
export class BackendBootupSequence {
  constructor (backend) {
    this.state = INIT
    this.backend = backend
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  static create (backend) {
    let boot = new BackendBootupSequence(backend)
    return boot.promise
  }

  resolve () {
    this._resolve(this.backend)
  }

  reject (err) {
    this._reject(err)
  }
}
