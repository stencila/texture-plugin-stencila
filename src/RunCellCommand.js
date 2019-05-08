import StencilaCommand from './_StencilaCommand'
import StencilaCell from './StencilaCell'
import StencilaInlineCell from './StencilaInlineCell'
import StencilaCellService from './StencilaCellService'

export default class RunCellCommand extends StencilaCommand {
  static get id () { return 'stencila:run-cell' }

  getCommandState (params, context) {
    const selectionState = params.selectionState
    const node = selectionState.node
    if (node && (node.type === StencilaCell.type || node.type === StencilaInlineCell.type)) {
      return {
        disabled: false,
        nodeId: node.id
      }
    }
    return { disabled: true }
  }

  execute (params, context) {
    let commandState = params.commandState
    context.config.getService(StencilaCellService.id, context).then(service => {
      service.runCell(commandState.nodeId)
    })
  }
}
