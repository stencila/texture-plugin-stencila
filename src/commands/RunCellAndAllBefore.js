import RunCell from './RunCell'

export default class RunCellAndAllBefore extends RunCell {
  static get id () { return 'stencila:run-cell-and-all-before' }

  _run (service, nodeId) {
    service.runCellAndAllBefore(nodeId)
  }
}
