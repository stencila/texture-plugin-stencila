import { isString } from 'substance'
import StencillaCellComponent from './StencilaCellComponent'

export default class StencillaInlineCellComponent extends StencillaCellComponent {
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
      return node.source
    }
  }
}
