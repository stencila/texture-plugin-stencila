import { TextOperation } from 'substance'

import { TokenizationRegistry } from 'monaco-editor/esm/vs/editor/common/modes.js'
import { Disposable } from 'monaco-editor/esm/vs/base/common/lifecycle.js'
import { Emitter } from 'monaco-editor/esm/vs/base/common/event.js'
import { Range } from 'monaco-editor/esm/vs/editor/common/core/range.js'
import { Selection } from 'monaco-editor/esm/vs/editor/common/core/selection'
import { TextModel } from 'monaco-editor/esm/vs/editor/common/model/textModel.js'
import { ModelLinesTokens } from 'monaco-editor/esm/vs/editor/common/model/textModelTokens.js'
import { ModelRawLineChanged, ModelRawLinesDeleted, ModelRawLinesInserted } from 'monaco-editor/esm/vs/editor/common/model/textModelEvents.js'
import { StaticServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js'
import { TypeOperations } from 'monaco-editor/esm/vs/editor/common/controller/cursorTypeOperations.js'
import { Configuration } from 'monaco-editor/esm/vs/editor/browser/config/configuration.js'
import { CursorConfiguration } from 'monaco-editor/esm/vs/editor/common/controller/cursorCommon.js'
import { ReplaceCommand, ReplaceCommandWithOffsetCursorState } from 'monaco-editor/esm/vs/editor/common/commands/replaceCommand.js'
import { LanguageConfigurationRegistry } from 'monaco-editor/esm/vs/editor/common/modes/languageConfigurationRegistry'

import createTextBuffer from './createTextBuffer'

/**
 * This is an adapter between Substance and Monaco.
 * It maintains a Monaco text buffer, keeping it updated when the model
 * is changed.
 *
 * Note: unfortunately we can not just extend monaco.TextModel because it does
 * too many undesired things in the ctor.
 */
export default class SubstanceMonacoAdapter extends Disposable {
  constructor (editorSession, sourcePath, options = {}) {
    super()

    this._editorSession = editorSession
    this._sourcePath = sourcePath

    let doc = editorSession.getDocument()
    let source = doc.get(sourcePath)
    let language = options.language

    // TODO: language should come from the document as well
    let languageSelection = StaticServices.modeService.get().create(language)
    this._languageIdentifier = languageSelection.languageIdentifier

    // TODO: this could come from configuration
    this._modelOptions = {
      defaultEOL: 1,
      indentSize: 2,
      insertSpaces: true,
      tabSize: 2,
      trimAutoWhitespace: false
    }
    let config = new Configuration({ language, value: source }, null, new StubAccessibilityService())
    this._config = config

    this._buffer = createTextBuffer(source, this._modelOptions.defaultEOL)
    this._cursorConfig = new CursorConfiguration(this._languageIdentifier, this._modelOptions, this._config)
    this._tokenizationListener = TokenizationRegistry.onDidChange(e => this._onTokenizerDidChange(e))
    this._onDidChangeTokens = this._register(new Emitter())
    this.onDidChangeTokens = this._onDidChangeTokens.event

    this._languageRegistryListener = LanguageConfigurationRegistry.onDidChange(e => {
      if (e.languageIdentifier.id === this._languageIdentifier.id) {
        this._cursorConfig = new CursorConfiguration(this._languageIdentifier, this._modelOptions, this._config)
      }
    })

    this._revalidateTokensTimeout = -1
    this._isDisposed = false
    this._isDisposing = false

    // init
    this._resetTokenizationState()
  }

  emitModelTokensChangedEvent (e) {
    TextModel.prototype.emitModelTokensChangedEvent.call(this, e)
  }

  findMatchingBracketUp (_bracket, _position) {
    return TextModel.prototype.findMatchingBracketUp.call(this, _bracket, _position)
  }
  _findMatchingBracketUp (data, position) {
    return TextModel.prototype._findMatchingBracketUp.call(this, data, position)
  }

  forceTokenization (lineNumber) {
    return TextModel.prototype.forceTokenization.call(this, lineNumber)
  }

  getLineCount () {
    return TextModel.prototype.getLineCount.call(this)
  }

  getLineContent (lineNumber) {
    return TextModel.prototype.getLineContent.call(this, lineNumber)
  }

  getLineFirstNonWhitespaceColumn (lineNumber) {
    return TextModel.prototype.getLineFirstNonWhitespaceColumn.call(this, lineNumber)
  }

  getLineMaxColumn (lineNumber) {
    return TextModel.prototype.getLineMaxColumn.call(this, lineNumber)
  }

  getLineLength (lineNumber) {
    return TextModel.prototype.getLineLength.call(this, lineNumber)
  }

  getLineTokens (lineNumber) {
    return TextModel.prototype.getLineTokens.call(this, lineNumber)
  }

  getOffsetAt (position) {
    this._assertNotDisposed()
    // ATTENTION: in the original implementation (monaco.TextModel) a validation
    // is done for 'position', which we do not want to do ATM
    return this._buffer.getOffsetAt(position.lineNumber, position.column)
  }

  getPositionAt (rawOffset) {
    return TextModel.prototype.getPositionAt.call(this, rawOffset)
  }

  isCheapToTokenize (lineNumber) {
    return TextModel.prototype.isCheapToTokenize.call(this, lineNumber)
  }

  matchBracket (position) {
    return TextModel.prototype.matchBracket.call(this, position)
  }

  _matchBracket (position) {
    return TextModel.prototype._matchBracket.call(this, position)
  }

  /**
   * Update the underlying Monaco buffer with a sequence of Substance TextOperations
   * @param {TextOperation[]} ops
   */
  updateBuffer (ops) {
    let oldLineCount = this._buffer.getLineCount()

    // Doing one buffer change per op to avoid need for transformed positions.
    let contentChanges = []
    for (let op of ops) {
      if (op.isInsert()) {
        // Note: this returns 'augmented' operations, but don't know what to do with
        // this yet... maybe it could be handy to maintain dirty-flags
        let start = this._buffer.getPositionAt(op.pos)
        let result = this._buffer.applyEdits([{
          // Note: operations in Monaco have an 'identifier'. Don't know if this is necessary or useful for us
          range: new Range(start.lineNumber, start.column, start.lineNumber, start.column),
          text: op.str,
          forceMoveMarkers: true
        }])
        contentChanges = contentChanges.concat(result.changes)
      } else if (op.isDelete()) {
        let start = this._buffer.getPositionAt(op.pos)
        let end = this._buffer.getPositionAt(op.pos + op.getLength())
        let result = this._buffer.applyEdits([{
          range: new Range(start.lineNumber, start.column, end.lineNumber, end.column),
          text: null,
          forceMoveMarkers: false
        }])
        contentChanges = contentChanges.concat(result.changes)
      }
    }

    // update tokens
    this._applyEditsOnTokens(contentChanges)
    if (this._tokens.hasLinesToTokenize(this._buffer)) {
      this._beginBackgroundTokenization()
    }

    // extract changes that can be mapped to DOM
    let changes = this._extractLineChanges(contentChanges, oldLineCount)
    return changes
  }

  validatePosition (position) {
    return TextModel.prototype.validatePosition.call(this, position)
  }

  _validatePosition (_lineNumber, _column, strict) {
    return TextModel.prototype._validatePosition.call(this, _lineNumber, _column, strict)
  }

  _assertNotDisposed () {
    TextModel.prototype._assertNotDisposed.call(this)
  }

  _beginBackgroundTokenization () {
    TextModel.prototype._beginBackgroundTokenization.call(this)
  }

  _clearTimers () {
    TextModel.prototype._clearTimers.call(this)
  }

  _getLineTokens (lineNumber) {
    return TextModel.prototype._getLineTokens.call(this, lineNumber)
  }

  _resetTokenizationState () {
    TextModel.prototype._resetTokenizationState.call(this)
  }

  _revalidateTokensNow (toLineNumber) {
    TextModel.prototype._revalidateTokensNow.call(this, toLineNumber)
  }

  _shouldAutoTokenize () {
    return true
  }

  _warmUpTokens () {
    TextModel.prototype._warmUpTokens.call(this)
  }

  _onTokenizerDidChange (e) {
    if (e.changedLanguages.indexOf(this._languageIdentifier.language) === -1) {
      return
    }
    this._resetTokenizationState()
    this.emitModelTokensChangedEvent({
      tokenizationSupportChanged: true,
      ranges: [{
        fromLineNumber: 1,
        toLineNumber: this.getLineCount()
      }]
    })
    this._warmUpTokens()
  }

  _applyEditsOnTokens (contentChanges) {
    for (let i = 0, len = contentChanges.length; i < len; i++) {
      let change = contentChanges[i]
      let [eolCount, firstLineLength] = TextModel._eolCount(change.text)
      try {
        this._tokens.applyEdits(change.range, eolCount, firstLineLength)
      } catch (err) {
        // emergency recovery => reset tokens
        this._tokens = new ModelLinesTokens(this._tokens.languageIdentifier, this._tokens.tokenizationSupport)
        return
      }
    }
  }

  _extractLineChanges (contentChanges, oldLineCount) {
    // HACK: unfortunately this is just a copy of code from TextModel._applyEdits
    // we need this in the SourceCodeComponent to incrementally update the DOM
    // e.g. adding or removing lines
    let newLineCount = this._buffer.getLineCount()
    let rawContentChanges = []
    if (contentChanges.length !== 0) {
      let lineCount = oldLineCount
      for (let i = 0, len = contentChanges.length; i < len; i++) {
        let change = contentChanges[i]
        let [eolCount] = TextModel._eolCount(change.text)
        let startLineNumber = change.range.startLineNumber
        let endLineNumber = change.range.endLineNumber
        let deletingLinesCnt = endLineNumber - startLineNumber
        let insertingLinesCnt = eolCount
        let editingLinesCnt = Math.min(deletingLinesCnt, insertingLinesCnt)
        let changeLineCountDelta = (insertingLinesCnt - deletingLinesCnt)
        for (let j = editingLinesCnt; j >= 0; j--) {
          let editLineNumber = startLineNumber + j
          let currentEditLineNumber = newLineCount - lineCount - changeLineCountDelta + editLineNumber
          rawContentChanges.push(new ModelRawLineChanged(editLineNumber, this.getLineContent(currentEditLineNumber)))
        }
        if (editingLinesCnt < deletingLinesCnt) {
          // Must delete some lines
          let spliceStartLineNumber = startLineNumber + editingLinesCnt
          rawContentChanges.push(new ModelRawLinesDeleted(spliceStartLineNumber + 1, endLineNumber))
        }
        if (editingLinesCnt < insertingLinesCnt) {
          // Must insert some lines
          let spliceLineNumber = startLineNumber + editingLinesCnt
          let cnt = insertingLinesCnt - editingLinesCnt
          let fromLineNumber = newLineCount - lineCount - cnt + spliceLineNumber + 1
          let newLines = []
          for (let j = 0; j < cnt; j++) {
            let lineNumber = fromLineNumber + j
            newLines[lineNumber - fromLineNumber] = this.getLineContent(lineNumber)
          }
          rawContentChanges.push(new ModelRawLinesInserted(spliceLineNumber + 1, startLineNumber + insertingLinesCnt, newLines))
        }
        lineCount += changeLineCountDelta
      }
    }
    return rawContentChanges
  }

  // Trying to reuse monaco implementation as good as possible
  // emulating a change on the monaco model, and mapping that to the substance model
  _type (ch) {
    // this resembles what Cursor._type() does
    // TypeOperations.typeWithInterceptors = function (prevEditOperationType, config, model, selections, ch)
    let editorSession = this._editorSession
    let sel = editorSession.getSelection()
    // TODO: we should make sure that the selection is a property selection on this editor
    let monacoSelection = this._createMonacoSelection(sel)
    let opResult = TypeOperations.typeWithInterceptors(0, this._cursorConfig, this, [monacoSelection], ch)
    // console.log('Monaco would do this:', opResult)
    let ops = []
    const L = opResult.commands.length
    let newOffset = sel.start.offset
    for (let i = 0; i < L; i++) {
      let cmd = opResult.commands[0]
      let isLast = i === L - 1
      switch (cmd.constructor) {
        case ReplaceCommand:
        case ReplaceCommandWithOffsetCursorState: {
          let range = cmd._range
          let text = cmd._text
          let startOffset = this.getOffsetAt({ lineNumber: range.startLineNumber, column: range.startColumn })
          if (!range.isEmpty()) {
            ops.push(TextOperation.Delete(startOffset, this._buffer.getValueInRange(range)))
          }
          ops.push(TextOperation.Insert(startOffset, text))
          if (isLast) {
            newOffset = startOffset + text.length
            if (cmd.constructor === ReplaceCommandWithOffsetCursorState) {
              // HACK: unfortunately, we can not use the buffer to compute the new selection offset
              // instead we have to do our own line-column mapping
              let tmp = createTextBuffer(text, this._modelOptions.defaultEOL)
              let lastLineNumber = tmp.getLineCount()
              let newLineNumber = lastLineNumber + cmd._lineNumberDeltaOffset
              let newColumn = tmp.getLineLength(lastLineNumber) + 1 + cmd._columnDeltaOffset
              let deltaOffset = tmp.getOffsetAt(newLineNumber, newColumn)
              newOffset = startOffset + deltaOffset
            }
          }
          break
        }
        default: {
          console.error('Unsupported monaco command', cmd)
        }
      }
    }

    _transformNonOverlappingTextOperations(ops)

    // trying to identify specific use-cases
    // I'd like to generalize if that is possible
    editorSession.transaction(tx => {
      // TODO: find out how this should be done correctly
      // Apparently, without any sorting, or transformation
      // commands will not be valid
      // HACK: this should be done more safely
      for (let op of ops) {
        tx.update(this._sourcePath, op)
      }
      tx.setSelection(sel.createWithNewRange(newOffset, newOffset))
    }, { action: 'type' })
  }

  _createMonacoSelection (sel) {
    if (sel.isPropertySelection()) {
      let startPosition = this.getPositionAt(sel.start.offset)
      let endPosition = startPosition
      if (!sel.isCollapsed()) {
        endPosition = this.getPositionAt(sel.end.offset)
      }
      let selectionStart, cursorPosition
      if (sel.isReverse()) {
        selectionStart = startPosition
        cursorPosition = endPosition
      } else {
        selectionStart = endPosition
        cursorPosition = startPosition
      }
      return new Selection(selectionStart.lineNumber, selectionStart.column, cursorPosition.lineNumber, cursorPosition.column)
    } else {
      return {}
    }
  }
}

/**
 * Experimental
 * Trying to map text operations that are based on the same document version, i.e. like they were done simultanously,
 * transforming their offsets so that they can be executed sequentially.
 * An assumption is that the ops are not overlapping.
 */
function _transformNonOverlappingTextOperations (ops) {
  // sorting in ascending order, but doing delete before insert if at the same position
  ops.sort((a, b) => {
    if (a.pos < b.pos) {
      return 1
    } else if (a.pos > b.pos) {
      return -1
    } else if (a.isDelete() && b.isInsert()) {
      return -1
    } else if (a.isInsert() && b.isDelete()) {
      return 1
    }
    return 0
  })
  return ops
}

class StubAccessibilityService extends Disposable {
  constructor () {
    super()

    this.onDidChangeAccessibilitySupport = this._register(new Emitter())
    this.onDidChangeAccessibilitySupport = this.onDidChangeAccessibilitySupport.event
  }

  getAccessibilitySupport () {
    return {}
  }
}
