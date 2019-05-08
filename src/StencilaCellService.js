import JavascriptContextService from './jscontext/JavascriptContextService'

export default class StencileCellService {
  constructor (context) {
    this.context = context
    this.editorSession = context.editorSession
    this.doc = this.editorSession.getDocument()
    if (!this.doc) {
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
    this.context.config.getService(JavascriptContextService.id, this.context).then(service => {
      let cell = this.editorSession.getDocument().get(cellId)
      service.requestExecution(cell.id, cell.source, res => {
        // TODO: do we really need this kind of call back, or would just 'res' be ok?
        this.editorSession.updateNodeStates([[cell.id, res]], { propagate: true })
      })
    })
  }
}
