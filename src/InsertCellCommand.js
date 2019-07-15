import { InsertNodeCommand } from 'substance-texture'
import StencilaCell from './StencilaCell'

export default class InsertCellCommand extends InsertNodeCommand {
  static get id () {
    return 'stencila:insert-cell'
  }

  execute (params, context) {
    let api = context.api
    let cell = api.insertBlockNode({ type: StencilaCell.type })
    api.focusEditor([cell.id, 'source'])
  }
}
