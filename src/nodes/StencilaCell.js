import { DocumentNode, STRING } from 'substance'

export default class StencilaCell extends DocumentNode {
  static getInitialNodeState () {
    return {
      status: 'not-evaluated',
      value: undefined,
      assignment: false,
      evalCounter: undefined,
      error: undefined
    }
  }
}

StencilaCell.schema = {
  type: 'stencila-cell',
  source: STRING
}
