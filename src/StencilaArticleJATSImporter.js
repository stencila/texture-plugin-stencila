import { ArticleJATSImporter } from 'substance-texture'
/**
 * TODO: several things we need a decision for the serialisation format.
 * In general we can use either:
 * - the DAR manifest: if data is valid for the whole DAR.
 * - Document wide attributes: would be represented as an attribute on the`<article>` element
 * - Document wide settings (complex): would be reflected as part of the article's `<front>` or `<article-meta>` element
 */
export default class StencilaArticleJATSImporter extends ArticleJATSImporter {
  import (jats, options = {}) {
    let doc = super.import(jats, options = {})

    // TBD: Language is stored as an attribute on the article element
    let articleEl = jats.find('article')
    let sourceLanguage = articleEl.attr('stencila:source-language')

    // EXPERIMENTAL: we need a way to 'configure' the article so that
    // the Stencila plugin knows that it is necessary to enable extensions, such as commands or tools
    doc.ENABLE_STENCILA_FEATURES = true

    return doc
  }
}
