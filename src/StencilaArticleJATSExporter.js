import { ArticleJATSExporter } from 'substance-texture'
import StencilaConfiguration from './nodes/StencilaConfiguration'

export default class StencilaArticleJATSExporter extends ArticleJATSExporter {
  export (doc) {
    let result = super.export(doc)
    if (result.ok) {
      // export stencila configuration values
      let config = doc.get(StencilaConfiguration.id)
      let jats = result.jats
      let articleEl = jats.find('article')
      articleEl.setAttribute('stencila:language', config.language)
    }
    return result
  }
}
