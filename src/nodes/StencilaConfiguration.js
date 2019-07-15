import { DocumentNode, ENUM } from 'substance'

export default class StencilaConfiguration extends DocumentNode {
  static get id () {
    return 'stencila:config'
  }
  static getConfiguration (doc) {
    return doc.get(StencilaConfiguration.id)
  }
  static getLanguage (doc) {
    let stencilaConfig = StencilaConfiguration.getConfiguration(doc)
    return stencilaConfig.language
  }
  static getLanguages () {
    return this.schema.getProperty('language').values
  }
}

StencilaConfiguration.schema = {
  type: 'stencila:config',
  language: ENUM(['python', 'r', 'julia', 'javascript'], { default: 'javascript' })
}
