import StencilaConfiguration from './nodes/StencilaConfiguration'
import StencilaCell from './nodes/StencilaCell';

/**
 * This service provides the client side for running cells,
 * as opposed to RuntimeService, which establish the connection
 * to the backend.
 */
export default class StencileCellService {
  constructor (context) {
    this.context = context
    this.editorSession = context.editorSession
    if (!this.editorSession) {
      throw new Error('Incompatible context')
    }
    this.editorSession.getEditorState().addObserver(['document'], this._onLanguageChange, this, { stage: 'render', document: { path: [StencilaConfiguration.id, 'language'] } })
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
    this._getRuntimeService()
      .then(service => {
        service.clearQueue()
        for (let cell of cells) {
          service.requestExecution(cell.id, cell.source, res => {
            this._onResult(res)
          })
        }
      })
      .catch(err => {
        // take the first cell to show the error
        console.error(err)
        let firstCell = cells[0]
        this._onResult({ id: firstCell.id, error: { description: `No runtime available for language '${this._getLang()}'` } })
      })
  }

  _getAllCells () {
    let doc = this.editorSession.getDocument()
    return doc.findAll('stencila-cell, stencila-inline-cell')
  }

  _resetAllCells () {
    let allCells = this._getAllCells()
    this.editorSession.updateNodeStates(allCells.map(cell => [cell.id, StencilaCell.getInitialNodeState()]), { propagate: true })
  }

  _getRuntimeService () {
    return this.context.config.getService(`stencila:runtime:${this._getLang()}`, this.context)
  }

  _getLang () {
    return StencilaConfiguration.getLanguage(this.editorSession.getDocument())
  }

  _onResult (res) {
    // TODO: do we really need this kind of call back, or would just 'res' be ok?
    res.status = res.error ? 'error' : 'ok'
    this.editorSession.updateNodeStates([[res.id, res]], { propagate: true })
  }

  _onLanguageChange () {
    // Note: need to wait for the next cycle, so that the current change is propagated
    setTimeout(() => {
      this._resetAllCells()
    })
  }
}
