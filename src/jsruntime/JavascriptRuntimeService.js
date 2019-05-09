/* globals Worker */
import { AbstractRuntimeService } from '../AbstractRuntimeService'

export default class JavascriptRuntimeService extends AbstractRuntimeService {
  constructor (context) {
    super(context)

    this.backend = null
    this.workerURL = 'lib/jsruntime/worker.js'
  }

  static get id () {
    return 'stencila:runtime:javascript'
  }

  static create (context) {
    return new JavascriptRuntimeService(context)
  }

  _whenBackendReady () {
    if (this.backend) {
      return Promise.resolve(this.backend)
    } else {
      return this._startWorker()
    }
  }

  _sendMessage (type, data) {
    this.backend.postMessage(data)
  }

  _cancelExecutionRequest () {
    // this is not possible for this service
  }

  _startWorker () {
    // TODO: this URL should be configurable
    let backend = new Worker(this.workerURL)
    backend.onmessage = e => this._onResponse(e.data)
    backend.onerror = e => this._onError(e)
    // already storing the worker so that we can use it during boot up
    this.backend = backend
    return this._waitForBackend(backend)
  }
}
