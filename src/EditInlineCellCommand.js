import { EditInlineNodeCommand } from 'substance'

export default class EditInlineCellCommand extends EditInlineNodeCommand {
  static get id () { return 'stencila:edit-inline-cell' }
}
