import { isString, isNil } from 'substance'
import { NodeOverlayEditorMixin } from 'substance-texture'
import StencillaCellComponent from './StencilaCellComponent'
import StencilaInlineCellEditor from './StencilaInlineCellEditor'

export default class StencillaInlineCellComponent extends NodeOverlayEditorMixin(StencillaCellComponent) {
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
    if (!isNil(nodeState.error)) {
      return 'ERR'
    } else if (!isNil(nodeState.value)) {
      let value = nodeState.value
      // complex objects are problematic for inline-cells
      // thus show only a short version for these
      if (!isString(value)) {
        return String(value)
      } else {
        return value
      }
    } else {
      return 'N/A'
    }
  }

  _getEditorClass () {
    return StencilaInlineCellEditor
  }
}
