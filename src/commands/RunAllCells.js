import { Command } from 'substance'
import StencilaCellService from '../StencilaCellService'
import StencilaCommandMixin from './_StencilaCommandMixin'

export default class RunAllCells extends StencilaCommandMixin(Command) {
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
