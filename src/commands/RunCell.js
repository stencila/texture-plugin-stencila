import StencilaCellService from '../StencilaCellService'
import CellCommand from './_CellCommand'

export default class RunCell extends CellCommand {
  static get id () { return 'stencila:run-cell' }

  execute (params, context) {
    let commandState = params.commandState
    context.config.getService(StencilaCellService.id, context).then(service => {
      this._run(service, commandState.nodeId)
    })
  }

  _run (service, nodeId) {
    service.runCell(nodeId)
  }
}
