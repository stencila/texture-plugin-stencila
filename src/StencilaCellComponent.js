import { Component } from 'substance'

export default class StencillaCellComponent extends Component {
  render ($$) {
    const node = this.props.node
    return $$('span').addClass('sc-stencila-cell').append(
      node.source
    )
  }
}
