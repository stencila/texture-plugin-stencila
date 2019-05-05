const b = require('substance-bundler')
const vfs = require('substance-bundler/extensions/vfs')
const path = require('path')

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
  _webpack(b, require('./monaco.webpack.config'))
})

b.task('build:js-context-worker', () => {
  _webpack(b, require('./jscontext.webpack.config'))
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

// bundler task for running webpack
function _webpack (b, config) {
  let webpack = require('webpack')
  let dest = config.output.path
  b.custom(`Webpack: ${dest}`, {
    src: null,
    dest,
    execute () {
      return new Promise((resolve, reject) => {
        function _handler (err, stats) {
          if (err) {
            console.error(err.stack || err)
            reject(err)
          } else if (stats.hasErrors()) {
            const info = stats.toJson()
            console.error(info.errors)
            reject(new Error(info.errors))
          } else {
            console.log('Finished in %s ms', stats.endTime - stats.startTime)
            resolve()
          }
        }
        if (b.opts.watch) {
          webpack(config).watch({}, _handler)
        } else {
          webpack(config, _handler)
        }
      })
    }
  })
}
