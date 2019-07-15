import StencilaCellService from '../StencilaCellService'
import CellCommand from './_CellCommand'

export default class RunAllCells extends CellCommand {
  static get id () { return 'stencila:run-all-cells' }

  getCommandState (params, context) {
    if (this.config.global) {
      return { disabled: false }
    } else {
      return super.getCommandState(params, context)
    }
  }

  execute (params, context) {
    context.config.getService(StencilaCellService.id, context).then(service => {
      service.runAll()
    })
    // HACK: without a selection change the dropdown stays open
    context.editorSession.getRootComponent().send('toggleOverlay')
  }
}
