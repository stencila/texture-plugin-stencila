export default class StencilaCellConverter {
  get type () { return 'stencila-cell' }
  get tagName () { return 'stencila:cell' }
  matchElement (el) {
    return el.tagName === this.tagName
  }
  import (el, node, importer) {
    let sourceEl = el.find('source')
    node.source = sourceEl.text()
  }

  export (node, el, exporter) {
    const $$ = exporter.$$
    el.append($$('stencila:source').append(
      el.createCDATASection(node.source)
    ))
  }
}
