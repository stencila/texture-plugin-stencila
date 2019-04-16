import { Command } from 'substance'

export default class RunCellCommand extends Command {
  static get id () { return 'stencila:run-cell' }

  getCommandState () {
    return { disabled: true }
  }

  execute () {}
}
