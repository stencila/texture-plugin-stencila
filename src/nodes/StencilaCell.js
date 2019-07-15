import { DocumentNode, STRING } from 'substance'

export default class StencilaCell extends DocumentNode {
  static getInitialNodeState () {
    return {
      status: 'not-evaluated',
      value: undefined,
      evalCounter: undefined,
      error: undefined
    }
  }
}

StencilaCell.schema = {
  type: 'stencila-cell',
  source: STRING
}
