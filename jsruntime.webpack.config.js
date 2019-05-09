const path = require('path')

module.exports = {
  entry: './src/jsruntime/JavascriptRuntimeWorker.js',
  output: {
    path: path.resolve(__dirname, 'dist', 'lib', 'jsruntime'),
    filename: 'worker.js'
  },
  mode: 'development',
  devtool: 'source-map'
}
