import { Command } from 'substance'

export default class RunAllCellsCommand extends Command {
  static get id () { return 'stencila:run-all-cells' }

  getCommandState () {
    return { disabled: true }
  }

  execute () {}
}
