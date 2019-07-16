import { Command } from 'substance'
import StencilaCell from '../nodes/StencilaCell'
import StencilaInlineCell from '../nodes/StencilaInlineCell'
import StencilaCommandMixin from './_StencilaCommandMixin'

export default class CellCommand extends StencilaCommandMixin(Command) {
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
}
