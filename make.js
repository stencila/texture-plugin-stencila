const b = require('substance-bundler')
const vfs = require('substance-bundler/extensions/vfs')
const path = require('path')
const webpack = require('webpack')

const DIST = 'dist/'
const TMP = 'dist/'

b.task('clean', function () {
  b.rm(DIST)
  b.rm(TMP)
}).describe('removes all generated files and folders.')

b.task('build', ['clean', 'build:assets', 'build:monaco', 'build:demo', 'build:plugin'])
  .describe('builds the library bundle.')

b.task('default', ['clean', 'build'])

b.task('build:plugin', () => {
  b.js('src/texture-plugin-stencila.js', {
    output: [{
      file: DIST + 'texture-plugin-stencila.js',
      format: 'umd',
      name: 'TexturePluginStencila',
      globals: {
        'substance': 'substance',
        'substance-texture': 'texture',
        'texture': 'texture',
        'katex': 'katex'
      }
    }],
    external: [ 'substance', 'substance-texture', 'texture', 'katex' ]
  })
})

b.task('build:assets', ['build:vfs'], () => {
  b.copy('./node_modules/substance-texture/dist', path.join(DIST, 'lib', 'texture'))
})

b.task('build:monaco', () => {
  b.custom('Bundling monaco', {
    src: 'src/monaco/*.js',
    dest: DIST + 'lib/monaco-editor',
    execute () {
      return new Promise((resolve, reject) => {
        webpack({
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
        }, (err, stats) => {
          if (err) {
            console.error(err.stack || err)
            reject(err)
          } else if (stats.hasErrors()) {
            const info = stats.toJson()
            console.error(info.errors)
            reject(new Error(info.errors))
          } else {
            resolve()
          }
        })
      })
    }
  })
})

b.task('build:demo', () => {
  b.js('./demo/web/editor.js', {
    output: [{
      file: DIST + 'editor.js',
      format: 'umd',
      name: 'textureEditor',
      globals: {
        'substance': 'substance',
        'substance-texture': 'texture',
        'texture': 'texture',
        'katex': 'katex'
      }
    }],
    external: ['substance', 'substance-texture', 'texture', 'katex']
  })
  b.copy('./demo/web/index.html', DIST)
})

b.task('build:vfs', () => {
  vfs(b, {
    src: ['./data/**/*'],
    dest: DIST + 'vfs.js',
    format: 'umd',
    moduleName: 'vfs',
    rootDir: path.join(__dirname, 'data')
  })
})

// Server configuration
let port = process.env['PORT'] || 4010
b.setServerPort(port)
b.serve({ static: true, route: '/', folder: './dist' })
