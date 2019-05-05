import { Component } from 'substance'

export default class StencillaCellComponent extends Component {
  didMount () {
    this.context.appState.addObserver(['document'], this._onNodeUpdate, this, {
      stage: 'render',
      document: { path: [this.props.node.id] }
    })
  }

  dispose () {
    this.context.appState.removeObserver(this)
  }

  render ($$) {
    const node = this.props.node
    const nodeState = node.state
    const CodeEditor = this.getComponent('code-editor')
    let el = $$('div').addClass('sc-stencila-cell')
    let editor = $$(CodeEditor, {
      document: node.getDocument(),
      path: [node.id, 'source'],
      // TODO: the language should come from somewhere else
      // in a classical Notebook, this would be set document wide
      // in a polyglot environment this would come from the cell
      language: 'javascript'
    }).ref('editor')
    el.append(editor)

    if (nodeState) {
      el.append(this._renderErrors($$, nodeState))
      el.append(this._renderValue($$, nodeState))
    }
    return el
  }

  _renderErrors ($$, nodeState) {
    if (nodeState.errors && nodeState.errors.length > 0) {
      let errorsEl = $$('div').addClass('se-errors')
      errorsEl.append(
        nodeState.errors.map(err => {
          // TODO: we have to specify a common format for errors
          return $$('div').addClass('se-error').text(err.description)
        })
      )
      return errorsEl
    }
  }

  _renderValue ($$, nodeState) {
    if (nodeState.value) {
      return $$('div').addClass('se-value').text(nodeState.value)
    }
  }

  _onNodeUpdate (change) {
    if (change.info.action === 'node-state-update') {
      this.rerender()
    }
  }
}
