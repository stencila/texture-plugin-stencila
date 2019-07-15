import { platform, getKeyForPath, parseKeyEvent } from 'substance'
import { Surface } from 'substance-texture'
import SourceCodeComponent from './SourceCodeComponent'

function _withName (props) {
  return Object.assign({}, props, { name: getKeyForPath(props.path) })
}

export default class CodeEditor extends Surface {
  constructor (parent, props, opts) {
    super(parent, _withName(props), opts)

    // TODO: what do we do in nodejs?
    if (platform.inBrowser) {
      this._monacoAdapter = new window.monaco.SubstanceMonacoAdapter(this.getEditorSession(), this.props.path, this.props)
    }
  }

  didMount () {
    super.didMount()

    if (this._monacoAdapter) {
      this._monacoAdapter.onDidChangeTokens(e => {
        this.refs.content._onDidChangeTokens(e)
      })
    }
  }

  dispose () {
    super.dispose()

    if (this._monacoAdapter) {
      this._monacoAdapter.dispose()
    }
  }

  render ($$) {
    const isEditable = this.isEditable()
    // TODO: try to inherit from Texture.TextInput
    // this may require some refactoring however
    let el = Surface.prototype.render.apply(this, arguments)
    el.addClass('sc-code-editor sc-surface')
    // Attention: being disabled does not necessarily mean not-editable, whereas non-editable is always disabled
    // A Surface can also be disabled because it is blurred, for instance.
    if (isEditable) {
      el.addClass('sm-editable')
      if (!this.props.disabled) {
        el.addClass('sm-enabled')
        el.attr('contenteditable', true)
        // native spellcheck
        el.attr('spellcheck', this.props.spellcheck === 'native')
      }
    } else {
      el.addClass('sm-readonly')
    }
    let content = $$(SourceCodeComponent, {
      monacoModel: this._monacoAdapter,
      document: this.getDocument(),
      path: this.props.path
    }).ref('content')
    el.append(content)

    return el
  }

  // this is needed e.g. by SelectAllCommand
  getPath () {
    return this.props.path
  }

  type (ch) {
    this._monacoAdapter._type(ch)
  }

  selectFirst () {
    this.getEditorSession().setSelection({
      type: 'property',
      path: this.props.path,
      startOffset: 0,
      surfaceId: this.id
    })
  }

  _handleEnterKey (event) {
    let combo = parseKeyEvent(event)
    if (combo === '13') {
      event.preventDefault()
      event.stopPropagation()
      this.type('\n')
    } else {
      super._handleEnterKey(event)
    }
  }

  _handleTabKey (event) {
    if (event.shiftKey) {
      console.log('TODO: dedent current line')
    } else {
      console.log('TODO: indent current line')
    }
  }

  _softBreak () {
    let editorSession = this.getEditorSession()
    editorSession.transaction(tx => {
      tx.insertText('\n')
    }, { action: 'soft-break' })
  }

  // HACK: this is needed e.g. by SelectAllCommand
  get _isTextPropertyEditor () {
    return true
  }
}
