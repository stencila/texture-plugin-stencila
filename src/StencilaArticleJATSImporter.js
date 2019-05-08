import { ArticleJATSImporter } from 'texture'

export default class StencilaArticleJATSImporter extends ArticleJATSImporter {
  import (...args) {
    let doc = super.import(...args)

    // EXPERIMENTAL: we need a way to 'configure' the article so that
    // the Stencila plugin knows that it is necessary to enable extensions, such as commands or tools
    doc.ENABLE_STENCILA_FEATURES = true

    return doc
  }
}
