import { Component } from 'substance'

export default class StencillaCellComponent extends Component {
  render ($$) {
    const node = this.props.node
    const CodeEditor = this.getComponent('code-editor')
    return $$('span').addClass('sc-stencila-cell').append(
      $$(CodeEditor, {
        document: node.getDocument(),
        path: [node.id, 'source'],
        // TODO: the language should come from somewhere else
        // in a classical Notebook, this would be set document wide
        // in a polyglot environment this would come from the cell
        language: 'javascript'
      })
    )
  }
}
