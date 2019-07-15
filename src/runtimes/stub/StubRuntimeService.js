import { AbstractRuntimeService } from '../AbstractRuntimeService'

export default class StubRuntimeService extends AbstractRuntimeService {
  constructor (context) {
    super(context)

    // have some state here to know if the backend has been booted
    this._fakeBackend = null
  }

  static create (context) {
    return new StubRuntimeService(context)
  }

  _whenBackendReady () {
    if (this._fakeBackend) {
      return Promise.resolve(this._fakeBackend)
    } else {
      return this._bootFakeBackend()
    }
  }

  _sendMessage (type, data) {
    this.backend.postMessage(data)
  }

  _cancelExecutionRequest (request) {
    console.log('Canceling request', request)
  }

  _bootFakeBackend () {
    return this._wa
  }
}
