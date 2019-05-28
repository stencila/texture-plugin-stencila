import { InsertNodeCommand } from 'substance-texture'
import StencilaCell from './StencilaCell'

export default class InsertCellCommand extends InsertNodeCommand {
  static get id () {
    return 'stencila:insert-cell'
  }

  createNode (tx) {
    return tx.create({ type: StencilaCell.type })
  }
}
