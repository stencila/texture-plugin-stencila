export default class StencileCellService {
  constructor (context) {
    this.context = context
    this.editorSession = context.editorSession
    if (!this.editorSession) {
      throw new Error('Incompatible context')
    }
  }

  static create (context) {
    return new StencileCellService(context)
  }

  static get id () {
    return 'stencila:cell-service'
  }

  runCell (cellId) {
    this._getLanguageService().then(service => {
      let cell = this.editorSession.getDocument().get(cellId)
      service.requestExecution(cell.id, cell.source, res => {
        this._onResult(res)
      })
    })
  }

  runAll () {
    let doc = this.editorSession.getDocument()
    // TODO: where to look for
    let allCells = doc.findAll('stencila-cell, stencila-inline-cell')
    this._getLanguageService().then(service => {
      service.clearQueue()
      for (let cell of allCells) {
        service.requestExecution(cell.id, cell.source, res => {
          this._onResult(res)
        })
      }
    })
  }

  _getLanguageService () {
    return this.context.config.getService(`stencila:runtime:${this._getLang()}`, this.context)
  }

  _getLang () {
    // TODO: language should come from article
    return 'javascript'
  }

  _onResult (res) {
    // TODO: do we really need this kind of call back, or would just 'res' be ok?
    res.status = res.error ? 'error' : 'ok'
    this.editorSession.updateNodeStates([[res.id, res]], { propagate: true })
  }
}