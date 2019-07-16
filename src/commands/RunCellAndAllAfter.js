import RunCell from './RunCell'

export default class RunCellAndAllAfter extends RunCell {
  static get id () { return 'stencila:run-cell-and-all-after' }

  _run (service, nodeId) {
    service.runCellAndAllAfter(nodeId)
  }
}
