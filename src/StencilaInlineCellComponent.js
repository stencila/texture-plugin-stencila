import { isString } from 'substance'
import StencillaCellComponent from './StencilaCellComponent'
import StencilaInlineCellEditor from './StencilaInlineCellEditor'

export default class StencillaInlineCellComponent extends StencillaCellComponent {
  constructor (...args) {
    super(...args)

    // while this is not a surface, we gonna use this as a parent id for the editor
    // TODO: node.id does appear twice here because
    // the editor itself, being bound to node.source adds node.id to the
    // surfaceId, too
    this._surfaceId = this.context.parentSurfaceId + '/' + this.props.node.id
  }

  didMount () {
    super.didMount()

    // keep a rendered editor around
    this._editor = new StencilaInlineCellEditor(this, { node: this.props.node })
    this._editor._render()
    this._editor.triggerDidMount()
    // ... which will be shown in the overlay panel whenever the selection demands so
    this.context.appState.addObserver(['selectionState'], this._deriveStateFromSelection, this, { stage: 'render' })
  }

  dispose () {
    super.dispose()

    // TODO: we might want to make sure that the overlay is cleaned up
    if (this._editor) this._editor.triggerDispose()
  }

  getChildContext () {
    return {
      parentSurfaceId: this._surfaceId
    }
  }

  render ($$) {
    let status = this._getStatus()
    let el = $$('span').addClass('sc-stencila-inline-cell').addClass(`sm-${status}`)
    el.append(
      this._renderValue($$)
    )
    return el
  }

  _renderValue ($$, value) {
    let node = this.props.node
    let nodeState = node.state || {}
    if (nodeState.hasOwnProperty('value')) {
      let value = nodeState.value
      // complex objects are problematic for inline-cells
      // thus show only a short version for these
      if (!isString(value)) {
        return String(value)
      } else {
        return value
      }
    } else {
      return 'undefined'
    }
  }

  _deriveStateFromSelection (selState) {
    let surfaceId = selState.selection.surfaceId
    let node = selState.node
    if (((node && node === this.props.node) || (surfaceId && surfaceId.startsWith(this._surfaceId)))) {
      this.context.editor.refs.overlay.acquireOverlay(this._editor, { anchor: this.el })
    } else {
      this.context.editor.refs.overlay.releaseOverlay(this._editor)
    }
  }
}
