/* globals Worker */
// Prototype of a Context
export default class JavascriptContextService {
  constructor (context = {}) {
    this.context = context
    this.queue = []
    this.worker = null
    this.workerURL = 'lib/jscontext/worker.js'
  }

  static get id () {
    return 'stencila:javascript-context'
  }

  static create (context) {
    return Promise.resolve(new JavascriptContextService(context))
  }

  requestExecution (id, src, cb) {
    console.log('JavascriptContextService.requestExecution', id, src)
    let existing = this.queue.findIndex(r => r.id === id)
    let triggerNext = this.queue.length === 0
    if (existing >= 0) {
      if (existing === 0) {
        console.log('.. cancelling already running request', id)
        triggerNext = true
        this._cancelCurrentExecution()
      }
      this.queue.splice(existing, 1)
    }
    this.queue.push(new ExecutionRequest(id, src, cb))
    if (triggerNext) {
      this._triggerNextExecution()
    }
  }

  _startWorker () {
    // TODO: this URL should be configurable
    let worker = new Worker(this.workerURL)
    this._waitForWorker = new WaitForWorker(worker)
    worker.onmessage = e => this._onWorkerMessage(e.data)
    worker.onerror = e => this._onWorkerError(e)
    // already storing the worker so that we can use it during boot up
    this.worker = worker
    return this._waitForWorker.getPromise()
  }

  _cancelCurrentExecution () {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  _finishCurrentExecution (data) {
    console.log('Javascript._finishCurrentExecution()', data)
    this._running = false
    // if an error occurs the whole execution is halted
    let req = this.queue.shift()
    if (data.errors) {
      console.error('Errors:', data.errors)
      // clearing the queue because we do not want to continue if one cell
      // has errored
      this.queue.length = 0
      // TODO: we should normalize the error format here
      let err = new Error('Errors during execution of ' + data.id)
      err.errors = data.errors
      req.cb(err)
    } else {
      // TODO: also needs specification
      req.cb(null, data)
      if (this.queue.length > 0) {
        this._triggerNextExecution()
      }
    }
  }

  _triggerNextExecution () {
    if (this._running) {
      throw new Error('Already running.')
    }
    this._whenWorkerReady().then(() => {
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

  _whenWorkerReady () {
    if (this.worker) {
      return Promise.resolve(this.worker)
    } else {
      return this._startWorker()
    }
  }

  _onWorkerMessage (data) {
    if (this._waitForWorker) {
      let waitForWorker = this._waitForWorker
      // worker booting protocol:
      // 1. launch worker
      // 2. sync assets
      // 3. done
      if (waitForWorker.state === INIT) {
        waitForWorker.state = SYNC
        this._getAssetBlobsForSync().then(entries => {
          this._sendMessage('POST', {
            command: 'sync',
            args: entries
          })
        })
      } else if (waitForWorker.state === SYNC) {
        delete this._waitForWorker
        waitForWorker.resolve()
      }
    } else {
      this._finishCurrentExecution(data)
    }
  }

  _sendMessage (type, data) {
    this.worker.postMessage(data)
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

  _onWorkerError (e) {
    if (this._waitForWorker) {
      console.error('Could not start worker')
      // TODO: we could also leave the _waitForWorker there
      // as a blocker for upcoming requests
      // and only remove it when a restart is explicitly asked for
      let waitForWorker = this._waitForWorker
      delete this._waitForWorker
      waitForWorker.reject(e)
    } else {
      // TODO: what to do here? should we stop the worker?
      console.error(e)
    }
  }
}

class ExecutionRequest {
  constructor (id, src, cb) {
    this.id = id
    this.src = src
    this.cb = cb
  }
}

const INIT = 0
const SYNC = 1

class WaitForWorker {
  constructor (worker) {
    this.state = INIT
    this.worker = worker
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve () {
    this._resolve(this.worker)
  }

  reject (err) {
    this._reject(err)
  }

  getPromise () {
    return this.promise
  }
}
