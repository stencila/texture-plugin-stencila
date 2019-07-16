import { Component, isPlainObject, isNil } from 'substance'
import StencilaConfiguration from '../nodes/StencilaConfiguration'

export default class StencillaCellComponent extends Component {
  didMount () {
    // rerender when node state has changed
    this.context.editorState.addObserver(['document'], this._onNodeUpdate, this, {
      stage: 'render',
      document: { path: [this.props.node.id] }
    })
    // rerender when lanuage has changed
    // this is necessary, because language is passed as a prop to CodeEditor
    this.context.editorState.addObserver(['document'], this.rerender, this, {
      stage: 'render',
      document: { path: [StencilaConfiguration.id, 'language'] }
    })
  }

  dispose () {
    this.context.editorState.removeObserver(this)
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
      let doc = node.getDocument()
      let editor = $$(CodeEditor, {
        document: doc,
        path: [node.id, 'source'],
        language: this._getLang()
      }).ref('editor')
      el.append(
        editor
      )
    }

    if (nodeState.error) {
      el.append(
        this._renderError($$, nodeState.error)
      )
    }

    if (!isNil(nodeState.value)) {
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

    let toggleSource = $$('div').addClass('se-toggle-source')
    if (this.state.showCode) {
      toggleSource.append(
        this.context.iconProvider.renderIcon($$, 'stencila:collapse-code')
      ).addClass('sm-expanded')
    } else {
      toggleSource.append(
        this.context.iconProvider.renderIcon($$, 'stencila:expand-code')
      ).addClass('sm-collapsed')
    }
    headerEl.append(toggleSource)

    let langEl = $$('div').addClass('se-title').text(this._getTitle())
    headerEl.append(langEl)

    headerEl.append($$('span').addClass('se-spacer'))

    let statusEl = $$('div').addClass('se-status').append(
      $$('span').addClass('se-label').text('status'),
      $$('span').addClass('se-status-value').addClass(`sm-${status}`).text(this.getLabel(`stencila:status:${status}`))
    )
    headerEl.append(statusEl)

    if (!isNil(nodeState.evalCounter)) {
      let evalCounterEl = $$('div').addClass('se-eval-counter').text(`[${nodeState.evalCounter}]`)
      headerEl.append(evalCounterEl)
    }

    return headerEl
  }

  _renderError ($$, error) {
    if (error) {
      return $$('div').addClass('se-error').text(error.description)
    }
  }

  _renderValue ($$, value) {
    let valueEl = $$('div').addClass('se-value').ref('value')
    // TODO: specify which result value types are supported and how to be represented
    if (value) {
      if (isPlainObject(value)) {
        switch (value.type) {
          case 'blob': {
            if (value.mimeType && value.mimeType.startsWith('image')) {
              valueEl.append(
                $$(ImageComponent, { value })
              )
            } else {
              valueEl.append('Unknown blob type')
            }
            break
          }
          case 'html': {
            // TODO: prevent HTML injection by stripping
            if (value.html && value.html.indexOf(/[<]\s*script/) > -1) {
              throw new Error('Dangerous HTML is prohibited')
            }
            valueEl.html(value.html)
            break
          }
          default: {
            valueEl.append(
              $$('pre').text(JSON.stringify(value, null, 2))
            )
          }
        }
      } else {
        valueEl.append(
          $$('pre').text(value)
        )
      }
    } else {
      valueEl.addClass('sm-hidden')
    }
    return valueEl
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
    let status
    if (nodeState) {
      status = nodeState.status
    }
    return status || 'not-evaluated'
  }

  _getLang () {
    return StencilaConfiguration.getLanguage(this.props.node.getDocument())
  }

  _getTitle () {
    return `Cell`
  }
}

class ImageComponent extends Component {
  dispose () {
    this._dispose()
  }

  willReceiveProps (newProps) {
    this._dispose()
    this._createBlobUrl()
  }

  render ($$) {
    return $$('img').attr('src', this._getUrl())
  }

  _createBlobUrl () {
    let blob = this.props.value.blob
    if (blob) {
      this._blobUrl = URL.createObjectURL(blob)
    }
    return this._blobUrl
  }

  _dispose () {
    if (this._blobUrl) {
      window.URL.revokeObjectURL(this._blobUrl)
      this._blobUrl = null
    }
  }

  _getUrl () {
    if (this.props.url) return this.props.url
    if (this._blobUrl) return this._blobUrl
    if (this.props.blob) {
      return this._createBlobUrl()
    }
  }
}
