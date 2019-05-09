/**
 * Helper that checks if the document instance has Stencila support enabled.
 * ATM, this is only the case if the StencilaArticleJATSImporter is used, i.e.
 * the article has the correct DOCTYPE set.
 *
 * @param {object} context
 */
export default function _isStencilaEnabled (context) {
  let editorSession = context.editorSession
  let doc = editorSession.getDocument()
  return Boolean(doc.ENABLE_STENCILA_FEATURES)
}
