import { getKeyForPath, isArrayEqual, Component } from 'substance'
import { TextPropertyComponent } from 'substance-texture'
import SourceLine from './SourceLine'

export default class SourceCodeComponent extends TextPropertyComponent {
  didMount () {
    // ATTENTION: not calling super.didMount() here because we do not want to rerender on change
    // instead we are listening to changes to the source, and mapping them into the
    // monaco model. As a result, a list of inserts, deletes, and updates are recorded
    // which are applied to the DOM in the 'render' stage
    this.context.appState.addObserver(['document'], this._onChange, this, { stage: 'update', document: { path: this.getPath() } })
    this.context.appState.addObserver(['document'], this._renderChanges, this, { stage: 'render', document: { path: this.getPath() } })
  }

  dispose () {
    this.context.appState.off(this)
  }

  shouldRerender () { return false }

  render ($$) {
    const path = this.props.path
    const model = this._getMonacoModel()

    let el = $$('div').addClass('sc-source-code sc-text-property')
    el.attr({
      'data-path': getKeyForPath(path)
    })
    el.css({
      'white-space': 'pre-wrap'
    })
    let lineCount = model.getLineCount()
    for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
      el.append(
        this._renderLine($$, lineNumber)
      )
    }
    return el
  }

  _renderLine ($$, lineNumber) {
    return $$(SourceLine, { model: this._getMonacoModel(), lineNumber })
  }

  _getMonacoModel () {
    return this.props.monacoModel
  }

  _onChange (change) {
    const path = this.getPath()
    let ops = change.ops.filter(op => isArrayEqual(path, op.path)).map(op => op.diff)
    this._updates = this._getMonacoModel().updateBuffer(ops)
  }

  _onDidChangeTokens (e) {
    // HACK: this is not inside the regular AppState update flow
    // thus we have to make sure that we recover the selection
    let needToRecoverSelection = this.context.surface._state.hasNativeFocus
    // console.log('Tokens changed for', getKeyForPath(this.props.path), e)
    let ranges = e.ranges
    let visited = new Set()
    for (let range of ranges) {
      for (let lineNumber = range.fromLineNumber; lineNumber <= range.toLineNumber; lineNumber++) {
        if (visited.has(lineNumber)) continue
        let lineComp = this._getLineComponent(lineNumber)
        if (lineComp) {
          lineComp.rerender()
        }
        visited.add(lineNumber)
      }
    }
    if (needToRecoverSelection) {
      this.context.surface.rerenderDOMSelection()
    }
  }

  _renderChanges () {
    try {
      let updates = this._updates
      this._updates = null
      if (updates && updates.length > 0) {
        for (let update of updates) {
          // TODO: try to use constants from the monaco lib
          switch (update.changeType) {
            // 2 = single line changed (insert or delete)
            case 2: {
              let lineNumber = update.lineNumber
              let lineComp = this._getLineComponent(lineNumber)
              lineComp.rerender()
              break
            }
            // 3 = lines deleted
            case 3: {
              // deleting backwards so that lineNumbers remain valid
              for (let lineNumber = update.toLineNumber; lineNumber >= update.fromLineNumber; lineNumber--) {
                let lineComp = this._getLineComponent(lineNumber)
                lineComp.remove()
              }
              let removedLines = update.toLineNumber - update.fromLineNumber + 1
              let lineCompAfter = this._getLineComponent(update.fromLineNumber)
              while (lineCompAfter) {
                lineCompAfter.extendProps({ lineNumber: lineCompAfter.props.lineNumber - removedLines })
                let nextLineEl = lineCompAfter.el.nextSibling
                if (!nextLineEl) break
                lineCompAfter = Component.getComponentForDOMElement(nextLineEl)
              }
              break
            }
            // 4 = lines inserted
            case 4: {
              // insert new SourceLines
              let lineCompAfter = this._getLineComponent(update.fromLineNumber)
              let elAfter = lineCompAfter ? lineCompAfter.el : null
              for (let lineNumber = update.fromLineNumber; lineNumber <= update.toLineNumber; lineNumber++) {
                // Note: incremental rendering is a bit inconvenient, but works
                let lineComp = new SourceLine(this, { model: this._getMonacoModel(), lineNumber })
                lineComp._render()
                this.el.insertBefore(lineComp.el, elAfter)
                if (this.isMounted()) {
                  lineComp.triggerDidMount()
                }
              }
              // update the lineNumber in all subsequent SourceLines
              let insertedLines = update.toLineNumber - update.fromLineNumber + 1
              while (lineCompAfter) {
                lineCompAfter.extendProps({ lineNumber: lineCompAfter.props.lineNumber + insertedLines })
                let nextLineEl = lineCompAfter.el.nextSibling
                if (!nextLineEl) break
                lineCompAfter = Component.getComponentForDOMElement(nextLineEl)
              }
              break
            }
            default: {
              console.error('FIXME: unsupported model update type', update)
            }
          }
        }
      }
    } catch (err) {
      // in case of an error do a force rerender
      console.error(err)
      this.rerender()
    }
  }

  _getLineComponent (lineNumber) {
    return this.getChildAt(lineNumber - 1)
  }

  _getDOMCoordinate (el, charPos) {
    let position = this._getMonacoModel().getPositionAt(charPos)
    let lineNumber = position.lineNumber
    let lineComp = this._getLineComponent(lineNumber)
    if (lineComp) {
      return lineComp._getDOMCoordinate(position.column - 1)
    } else {
      console.error('FIXME: tried to get DOM coordinate for a line which is not rendered or has been removed.')
    }
  }

  _getCharPos (node, offset) {
    // this should be the 99.99% case, where the cursor is on a text node
    if (node.isTextNode()) {
      let parent = node.getParent()
      if (parent.hasClass('se-token')) {
        let tokenEl = parent
        let sourceLineComp = Component.getComponentForDOMElement(tokenEl.getParent())
        return sourceLineComp._getCharPos(node, offset)
      } else if (parent.hasClass('sc-source-line')) {
        return offset
      } else {
        console.error('FIXME: unforeseen edge case in SourceCodeComponent._getCharPos()', node, offset)
      }
    } else if (node.hasClass('sc-source-line')) {
      let sourceLineComp = Component.getComponentForDOMElement(node)
      return sourceLineComp._getCharPos(node, offset)
    } else {
      console.error('FIXME: there is an edge case with selection mapping for CodeEditor', node, offset)
    }
    return super._getCharPos(node, offset)
  }
}
