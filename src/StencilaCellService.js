/**
 * This service provides the client side for running cells,
 * as opposed to RuntimeService, which establish the connection
 * to the backend.
 *
 */
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
    let cell = this.editorSession.getDocument().get(cellId)
    this._runCells([cell])
  }

  runCellAndAllBefore (cellId) {
    let allCells = this._getAllCells()
    let cellIdx = allCells.findIndex(cell => cell.id === cellId)
    if (cellIdx >= 0) {
      this._runCells(allCells.slice(0, cellIdx + 1))
    }
  }

  runCellAndAllAfter (cellId) {
    let allCells = this._getAllCells()
    let cellIdx = allCells.findIndex(cell => cell.id === cellId)
    if (cellIdx >= 0) {
      this._runCells(allCells.slice(cellIdx))
    }
  }

  runAll () {
    this._runCells(this._getAllCells())
  }

  _runCells (cells) {
    this._getLanguageService().then(service => {
      service.clearQueue()
      for (let cell of cells) {
        service.requestExecution(cell.id, cell.source, res => {
          this._onResult(res)
        })
      }
    })
  }

  _getAllCells () {
    let doc = this.editorSession.getDocument()
    return doc.findAll('stencila-cell, stencila-inline-cell')
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
