import { InlineNode, STRING } from 'substance'

export default class StencilaInlineCell extends InlineNode {}
StencilaInlineCell.schema = {
  type: 'stencila-inline-cell',
  source: STRING
}
