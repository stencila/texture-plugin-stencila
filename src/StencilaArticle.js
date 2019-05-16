import { InternalArticleDocument } from 'substance-texture'

const STENCILA_JATS_PUBLIC_ID = '-//RDS/DTD Stencila Reproducible Documents DTD v1.0'

export default class StencilaArticle extends InternalArticleDocument {
  static get docTypeId () { return STENCILA_JATS_PUBLIC_ID }
}
