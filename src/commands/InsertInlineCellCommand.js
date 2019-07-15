import { InsertInlineNodeCommand } from 'substance-texture'
import StencilaInlineCell from '../StencilaInlineCell'

export default class InsertInlineCellCommand extends InsertInlineNodeCommand {
  static get id () {
    return 'stencila:insert-inline-cell'
  }

  getType () {
    return StencilaInlineCell.type
  }

  execute (params, context) {
    let inlineCell = context.api.insertInlineNode({ type: StencilaInlineCell.type })
    context.api.focusEditor([inlineCell.id, 'source'])
  }
}
