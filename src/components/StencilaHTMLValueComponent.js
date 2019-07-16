import { Component, sanitizeHTML } from 'substance'

export default class StencilaHTMLValueComponent extends Component {
  render ($$) {
    let value = this.props.value
    return $$('div').addClass('sc-stencila-html-value').html(sanitizeHTML(value.html))
  }
}
