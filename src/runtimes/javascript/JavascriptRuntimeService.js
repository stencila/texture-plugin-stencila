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

  _sendMessage (type, data) {
    this.backend.postMessage(data)
  }

  _cancelExecutionRequest () {
    // this is not possible for this service
  }

  _boot () {
    // start the worker
    // NOTE: that the worker will respond when up
    // and then triggering this service which proceeds with the bootup
    let backend = new Worker(this.workerURL)
    backend.onmessage = e => this._onResponse(e.data)
    backend.onerror = e => this._onError(e)
    this.backend = backend
  }
}
