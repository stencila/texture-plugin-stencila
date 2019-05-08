import { Command } from 'substance'
import _shouldBeEnabled from './_shouldBeEnabled'

export default class StencilaCommand extends Command {
  shouldBeEnabled (context) {
    return _shouldBeEnabled(context)
  }
}
