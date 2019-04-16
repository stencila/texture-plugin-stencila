import { Component } from 'substance'

export default class StencillaInlineCellComponent extends Component {
  render ($$) {
    const node = this.props.node
    return $$('span').addClass('sc-stencila-inline-cell').append(
      node.source
    )
  }
}
