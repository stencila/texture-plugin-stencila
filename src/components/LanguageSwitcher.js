import { Component } from 'substance'
import { OverlayMixin } from 'substance-texture'
import StencilaConfiguration from '../nodes/StencilaConfiguration'

export default class LanguageSwitcher extends OverlayMixin(Component) {
  didMount () {
    super.didMount()

    this.context.editorState.addObserver(['document'], this.rerender, this, {
      stage: 'render',
      document: { path: [StencilaConfiguration.id, 'language'] }
    })
  }

  getId () {
    return 'language-switcher'
  }

  render ($$) {
    const editorState = this.context.editorState
    const lang = StencilaConfiguration.getLanguage(editorState.document)
    const showChoices = this._canShowOverlay()
    const theme = this.props.theme

    let el = $$('div').addClass('sc-language-switcher sc-tool-dropdown')
    if (this._canShowOverlay()) {
      el.addClass('sm-open')
    }

    const Button = this.getComponent('button')
    let toggleButton = $$(Button, {
      dropdown: true,
      active: showChoices,
      label: this.getLabel(`stencila:language:${lang}`),
      theme
    }).ref('toggle')
      .attr('title', this.getLabel('stencila:cell-language'))
      .addClass('se-toggle')
      .on('click', this._onClick)
      // ATTENTION: we need to preventDefault on mousedown, otherwise
      // native DOM selection disappears
      .on('mousedown', this._onMousedown)
    el.append(toggleButton)

    if (showChoices) {
      el.append(
        $$('div').addClass('se-choices').append(
          this._renderItems($$)
        ).ref('choices')
      )
    }
    return el
  }

  _renderItems ($$) {
    const theme = this.props.theme
    let languages = StencilaConfiguration.getLanguages()
    let language = this._getConfiguration().language
    return languages.map(l => {
      let el = $$('button').addClass('sc-tool sc-button sm-theme-' + theme)
      el.append(this.getLabel(`stencila:language:${l}`))
      if (l === language) el.addClass('sm-active')
      el.on('click', this._onChange.bind(this, l))
      return el
    })
  }

  _getConfiguration () {
    return StencilaConfiguration.getConfiguration(this.context.editorState.document)
  }

  _onClick (event) {
    event.preventDefault()
    event.stopPropagation()
    this._toggleOverlay()
  }

  _onMousedown (event) {
    event.preventDefault()
  }

  _onChange (newLang) {
    if (newLang !== this._getConfiguration().language) {
      this.context.editorSession.transaction(tx => {
        tx.set([StencilaConfiguration.id, 'language'], newLang)
      })
    }
  }
}
