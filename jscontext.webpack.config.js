const path = require('path')

module.exports = {
  entry: './src/jscontext/JavascriptContextWorker.js',
  output: {
    path: path.resolve(__dirname, 'dist', 'lib', 'jscontext'),
    filename: 'worker.js'
  },
  mode: 'development',
  devtool: 'source-map'
}
