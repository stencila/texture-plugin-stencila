import StencilaCommand from './_StencilaCommand'
import StencilaCellService from '../StencilaCellService'

export default class RunAllCellsCommand extends StencilaCommand {
  static get id () { return 'stencila:run-all-cells' }

  getCommandState (params, context) {
    return { disabled: false }
  }

  execute (params, context) {
    context.config.getService(StencilaCellService.id, context).then(service => {
      service.runAll()
    })
  }
}
