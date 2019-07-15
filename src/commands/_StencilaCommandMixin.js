import _isStencilaEnabled from './_isStencilaEnabled'

export default function StencilaCommandMixin (Command) {
  class StencilaCommand extends Command {
    shouldBeEnabled (context) {
      return _isStencilaEnabled(context)
    }
  } return StencilaCommand
}
