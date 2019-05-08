import StencilaCommand from './_StencilaCommand'

export default class RunAllCellsCommand extends StencilaCommand {
  static get id () { return 'stencila:run-all-cells' }

  getCommandState (params, context) {
    // TODO: it would be better not register the comman
    params.editorSession.getDocument()
    return { disabled: false }
  }

  execute () {}
}
