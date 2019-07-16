import { PieceTreeTextBufferBuilder } from 'monaco-editor/esm/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder.js'

export default function createTextBuffer (value, defaultEOL) {
  var factory = (typeof value === 'string' ? _createTextBufferFactory(value) : value)
  return factory.create(defaultEOL)
}

function _createTextBufferBuilder () {
  return new PieceTreeTextBufferBuilder()
}

function _createTextBufferFactory (text) {
  var builder = _createTextBufferBuilder()
  builder.acceptChunk(text)
  return builder.finish()
}
