const path = require('path')

module.exports = {
  mode: 'development',
  entry: {
    'monaco': './src/monaco/index.js',
    // Package each language's worker and give these filenames in `getWorkerUrl`
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
    'css.worker': 'monaco-editor/esm/vs/language/css/css.worker',
    'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
    'typescript.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker'
  },
  output: {
    globalObject: 'self',
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist', 'lib', 'monaco-editor')
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }]
  }
}
