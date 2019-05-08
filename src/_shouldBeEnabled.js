export default function _shouldBeEnabled (context) {
  let editorSession = context.editorSession
  let doc = editorSession.getDocument()
  return Boolean(doc.ENABLE_STENCILA_FEATURES)
}
