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
    context.config.getService(JavascriptContextService.id, context).then(service => {
      let cell = editorSession.getDocument().get(commandState.nodeId)
      service.requestExecution(cell.id, cell.source, (err, res) => {
        if (err) {
          // TODO: do we really need this kind of call back, or would just 'res' be ok?
          editorSession.updateNodeStates([[cell.id, res]], { propagate: true })
        } else {
          editorSession.updateNodeStates([[cell.id, res]], { propagate: true })
        }
      })
    })
  }
}
