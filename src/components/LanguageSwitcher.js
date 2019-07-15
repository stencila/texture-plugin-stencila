import { Component } from 'substance'
import StencilaConfiguration from '../nodes/StencilaConfiguration'

export default class LanguageSwitcher extends Component {
  didMount () {
    this.context.editorState.addObserver(['document'], this.rerender, this, {
      stage: 'render',
      document: { path: [StencilaConfiguration.id, 'language'] }
    })
  }

  dispose () {
    this.context.editorState.removeObserver(this)
  }

  render ($$) {
    // this is taking possible languages from the schema
    // TODO: don't if this is really what we want on the long run
    let el = $$('div').addClass('sc-language-switcher')
    let languages = StencilaConfiguration.getLanguages()
    let language = this._getConfiguration().language
    let select = $$('select').addClass('se-select').ref('select')
      .attr('title', this.getLabel('stencila:cell-language'))
      .on('change', this._onChange)
    select.append(
      languages.map(l => {
        let option = $$('option').val(l).text(this.getLabel(`stencila:language:${l}`))
        if (l === language) option.setAttribute('selected', true)
        return option
      })
    )
    el.append(select)
    return el
  }

  _getConfiguration () {
    return StencilaConfiguration.getConfiguration(this.context.editorState.document)
  }

  _onChange () {
    let newLang = this.refs.select.getValue()
    this.context.editorSession.transaction(tx => {
      tx.set([StencilaConfiguration.id, 'language'], newLang)
    })
  }
}
