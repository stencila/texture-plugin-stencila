import { ArticleJATSImporter } from 'substance-texture'
import StencilaConfiguration from './nodes/StencilaConfiguration';

export default class StencilaArticleJATSImporter extends ArticleJATSImporter {
  import (jats, options) {
    let doc = super.import(jats, options)

    // EXPERIMENTAL: we need a way to 'configure' the article so that
    // the Stencila plugin knows that it is necessary to enable extensions, such as commands or tools
    doc.ENABLE_STENCILA_FEATURES = true

    // import configuration
    let config = doc.create({ type: StencilaConfiguration.type, id: StencilaConfiguration.id })
    let articleEl = jats.find('article')
    config.set('language', articleEl.getAttribute('stencila:language'))

    return doc
  }
}
