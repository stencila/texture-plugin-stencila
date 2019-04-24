import { Component } from 'substance'

// TODO: I want to optimize this, by not rendering data-offset into the
// DOM and instead using the buffer for mapping selections
export default class SourceLine extends Component {
  // Note: rerender is called explicitly and updating the lineNumber should not
  // lead to a rerender
  shouldRerender () { return false }

  render ($$) {
    let model = this.props.model
    let lineNumber = this.props.lineNumber
    let lineContent = model.getLineContent(lineNumber)
    let tokens = model.getLineTokens(lineNumber)
    let tokenCount = tokens.getCount()
    // TODO: use a different mapping strategy instead
    let el = $$('div').addClass('sc-source-line')
    if (lineContent.length === 0) {
      el.append($$('br'))
    } else if (tokenCount > 0) {
      for (let idx = 0; idx < tokenCount; idx++) {
        let content = lineContent.substring(tokens.getStartOffset(idx), tokens.getEndOffset(idx))
        let part = $$('span').addClass(tokens.getClassName(idx)).addClass('se-token')
        part.append(content)
        el.append(part)
      }
    } else {
      el.append(lineContent)
    }
    return el
  }

  _getDOMCoordinate (offset) {
    // NOTE: either there is no tokenization, then the column
    let model = this.props.model
    let lineNumber = this.props.lineNumber
    let lineContent = model.getLineContent(lineNumber)
    let tokens = model.getLineTokens(lineNumber)
    let tokenCount = tokens.getCount()
    if (lineContent.length === 0) {
      return {
        container: this.el.getNativeElement(),
        offset: 0
      }
    } else if (tokenCount === 0) {
      return {
        container: this.el.getNativeElement(),
        offset
      }
    } else {
      for (let idx = 0; idx < tokenCount; idx++) {
        let startOffset = tokens.getStartOffset(idx)
        let endOffset = tokens.getEndOffset(idx)
        if (startOffset <= offset && endOffset >= offset) {
          return {
            container: this.el.getChildAt(idx).getChildAt(0).getNativeElement(),
            offset: offset - startOffset
          }
        }
      }
    }
  }

  _getCharPos (node, offset) {
    let model = this.props.model
    const lineNumber = this.props.lineNumber
    let tokenEl
    let _parent = node.getParent()
    if (node.isTextNode()) {
      if (_parent.hasClass('se-token')) {
        tokenEl = _parent
        let tokenIdx = this.el.getChildIndex(tokenEl)
        if (tokenIdx > -1) {
          let tokens = model.getLineTokens(lineNumber)
          let lineOffset = model.getOffsetAt({ lineNumber, column: 1 })
          let tokenOffset = tokens.getStartOffset(tokenIdx)
          return lineOffset + tokenOffset + offset
        } else {
          console.error('FIXME: unforeseen edge case in SourceLine._getCharPos()', node, offset)
        }
      } else if (_parent.hasClass('sc-source-line')) {
        return model.getOffsetAt(this.props.lineNumber, offset + 1)
      }
    } else if (node === this.el) {
      let lineOffset = model.getOffsetAt({ lineNumber, column: 1 })
      return lineOffset
    }
    console.error('FIXME: unforeseen edge-case in SourceLine._getCharPos()', node, offset)
  }
}
