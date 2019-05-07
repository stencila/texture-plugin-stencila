import { Component } from 'substance'

/**
 * Re-implementing a similar UI as promoted in the RDS stack prototype
 * but using a REPL like Notebook mechanism (as opposed to reactive computation).
 */

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

  getInitialState () {
    return {
      showCode: true
    }
  }

  render ($$) {
    const node = this.props.node
    const nodeState = node.state || {}
    const CodeEditor = this.getComponent('code-editor')
    let el = $$('div').addClass('sc-stencila-cell')

    el.append(this._renderHeader($$))

    if (this.state.showCode) {
      let editor = $$(CodeEditor, {
        document: node.getDocument(),
        path: [node.id, 'source'],
        // TODO: the language should come from the Notebook
        language: 'javascript'
      }).ref('editor')
      el.append(
        editor
      )
    }

    if (nodeState.errors && nodeState.errors.length > 0) {
      el.append(
        this._renderErrors($$, nodeState.errors)
      )
    }

    if (nodeState.hasOwnProperty('value')) {
      el.append(
        this._renderValue($$, nodeState.value)
      )
    }

    return el
  }

  _renderHeader ($$) {
    let headerEl = $$('button').addClass('se-header')
      .on('click', this._toggleSourceCode)

    let nodeState = this.props.node.state || {}
    let status = this._getStatus()
    headerEl.addClass(`sm-${status}`)

    let toggleSource = $$('div').addClass('se-toggle-source').append(
      this.context.iconProvider.renderIcon($$, this.state.showCode ? 'stencila:collapse-code' : 'stencila:expand-code')
    )
    headerEl.append(toggleSource)

    if (!this.state.showCode) {
      let langEl = $$('div').addClass('se-title').text(`${this._getLangTitle()} Cell`)
      headerEl.append(langEl)
    }

    headerEl.append($$('span').addClass('se-spacer'))

    let statusEl = $$('div').addClass('se-status').append(
      $$('span').addClass('se-label').text('status'),
      $$('span').addClass('se-status-value').addClass(`sm-${status}`).text(status)
    )
    headerEl.append(statusEl)

    if (nodeState.hasOwnProperty('count')) {
      let countEl = $$('div').addClass('se-count').append(
        $$('span').addClass('se-count').text(`[${nodeState.count}]`)
      )
      headerEl.append(countEl)
    }

    return headerEl
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

  _renderValue ($$, value) {
    return $$('pre').addClass('se-value').text(value)
  }

  _onNodeUpdate (change) {
    if (change.info.action === 'node-state-update') {
      this.rerender()
    }
  }

  _toggleSourceCode (e) {
    e.preventDefault()
    e.stopPropagation()
    this.extendState({ showCode: !this.state.showCode })
  }

  _getStatus () {
    let nodeState = this.props.node.state
    if (nodeState) {
      return nodeState.status
    } else {
      return 'not-evaluated'
    }
  }

  _getLang () {
    return 'javascript'
  }

  _getLangTitle () {
    return 'Javascript'
  }
}
