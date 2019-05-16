import { Component } from 'substance'
import { NodeComponentMixin } from 'substance-texture'

export default class StencilaInlineCellEditor extends NodeComponentMixin(Component) {
  render ($$) {
    const node = this._getNode()
    const nodeState = node.state || {}
    const CodeEditor = this.getComponent('code-editor')

    let el = $$('div').addClass('sc-stencila-inline-cell-editor')

    el.append(this._renderHeader($$))

    let editor = $$(CodeEditor, {
      document: node.getDocument(),
      path: [node.id, 'source'],
      language: this._getLang()
    }).ref('editor')
    el.append(editor)

    if (nodeState.errors) {
      el.append(this._renderErrors($$, nodeState.errors))
    }

    return el
  }

  _renderErrors ($$, errors) {
    let errorsEl = $$('div').addClass('se-errors')
    errorsEl.append(
      errors.map(err => {
        // TODO: we have to specify a common format for errors
        return $$('div').addClass('se-error').text(err.description)
      })
    )
    return errorsEl
  }

  _renderHeader ($$) {
    let headerEl = $$('div').addClass('se-header')
    let node = this._getNode()
    let nodeState = node.state || {}
    let status = this._getStatus()
    headerEl.addClass(`sm-${status}`)

    let langEl = $$('span').addClass('se-title').text(`${this._getLangTitle()} Inline Cell`)
    headerEl.append(langEl)

    headerEl.append($$('span').addClass('se-spacer'))

    let statusEl = $$('span').addClass('se-status').append(
      $$('span').addClass('se-label').text('status'),
      $$('span').addClass('se-status-value').addClass(`sm-${status}`).text(this.getLabel(`stencila:status:${status}`))
    )
    headerEl.append(statusEl)

    if (nodeState.hasOwnProperty('count')) {
      let countEl = $$('span').addClass('se-count').append(
        $$('span').addClass('se-count').text(`[${nodeState.count}]`)
      )
      headerEl.append(countEl)
    }

    return headerEl
  }

  _getLang () {
    // TODO: this should come from the document
    return 'javascript'
  }

  _getLangTitle () {
    return 'Javascript'
  }

  _getNode () {
    return this.props.node
  }

  _getStatus () {
    let node = this._getNode()
    let nodeState = node.state
    if (nodeState) {
      return nodeState.status
    } else {
      return 'not-evaluated'
    }
  }
}
