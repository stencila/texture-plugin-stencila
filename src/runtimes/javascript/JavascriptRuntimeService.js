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

  _cancelExecutionRequest () {
    // this is not possible for this service
  }

  _boot () {
    // start the worker
    // NOTE: the worker will respond when running triggering the further bootup
    let backend = new Worker(this.workerURL)
    backend.onmessage = e => this._onResponseFromWorker(e)
    backend.onerror = e => this._onErrorFromWorker(e)
    this.backend = backend
  }

  _bootFinished () {
    // nothing to do here
  }

  _sendAssets (entries) {
    this.backend.postMessage({
      command: 'sync',
      args: entries
    })
  }

  _sendExecutionRequest (id, src) {
    this.backend.postMessage({
      command: 'execute',
      args: {
        id,
        src
      }
    })
  }

  _onResponseFromWorker (e) {
    this._proceedWithResponse(e.data)
  }

  _onErrorFromWorker (e) {
    this._proceedWithError(e)
  }
}
