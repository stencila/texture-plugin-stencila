import { Command } from 'substance'
import _isStencilaEnabled from './_isStencilaEnabled'

export default class StencilaCommand extends Command {
  shouldBeEnabled (context) {
    return _isStencilaEnabled(context)
  }
}
