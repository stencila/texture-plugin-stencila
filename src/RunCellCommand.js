import { Command } from 'substance'
import StencilaCell from './StencilaCell'
import StencilaInlineCell from './StencilaInlineCell'
import JavascriptContextService from './jscontext/JavascriptContextService'

export default class RunCellCommand extends Command {
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
    let editorSession = params.editorSession
    let commandState = params.commandState
    // TODO: the service should be language specific
    context.config.getService(JavascriptContextService.id).then(service => {
      let cell = editorSession.getDocument().get(commandState.nodeId)
      service.requestExecution(cell.id, cell.source, (err, res) => {
        if (err) {
          // TODO: define the interface properly
          editorSession.updateNodeStates([[cell.id, { value: undefined, errors: err.errors }]], { propagate: true })
        } else {
          editorSession.updateNodeStates([[cell.id, { value: res.value, errors: null }]], { propagate: true })
        }
      })
    })
  }
}
