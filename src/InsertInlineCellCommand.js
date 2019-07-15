import { InsertInlineNodeCommand } from 'substance-texture'
import StencilaInlineCell from './StencilaInlineCell'

export default class InsertInlineCellCommand extends InsertInlineNodeCommand {
  static get id () {
    return 'stencila:insert-inline-cell'
  }

  getType () {
    return StencilaInlineCell.type
  }

  execute (params, context) {
    context.api._insertInlineNode(tx => tx.create({ type: StencilaInlineCell.type }))
  }
}
