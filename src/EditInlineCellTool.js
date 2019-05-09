import { domHelpers } from 'substance'
import { ToggleTool } from 'texture'

export default class EditInlineCellTool extends ToggleTool {
  render ($$) {
    const { nodeId } = this.props.commandState
    const Input = this.getComponent('input')
    let el = $$('div').addClass('sc-edit-inline-cell-tool')
    let input = $$(Input, {
      type: 'text',
      path: [nodeId, 'source'],
      placeholder: this.getLabel('stencila:placeholder:source')
    })
    // stopping keydown events so that the input field is not distracted by other editor keyboard handler
    input.on('keydown', domHelpers.stop)
    el.append(input)
    return el
  }
}
