import { InsertNodeCommand } from 'substance-texture'
import StencilaCommandMixin from './_StencilaCommandMixin'
import StencilaCell from '../nodes/StencilaCell'

export default class InsertCell extends StencilaCommandMixin(InsertNodeCommand) {
  static get id () {
    return 'stencila:insert-cell'
  }

  execute (params, context) {
    let api = context.api
    let cell = api.insertBlockNode({ type: StencilaCell.type })
    api.focusEditor([cell.id, 'source'])
  }
}
