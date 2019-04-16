import StencilaCellConverter from './StencilaCellConverter'

export default class StencilaInlineCellConverter extends StencilaCellConverter {
  get type () { return 'stencila-inline-cell' }
  get tagName () { return 'stencila:inline-cell' }
}
