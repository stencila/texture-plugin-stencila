import { DocumentNode, STRING } from 'substance'

export default class StencilaCell extends DocumentNode {}

StencilaCell.schema = {
  type: 'stencila-cell',
  source: STRING
}
