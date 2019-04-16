const b = require('substance-bundler')
const vfs = require('substance-bundler/extensions/vfs')
const path = require('path')

const DIST = 'dist/'
const TMP = 'dist/'

b.task('clean', function () {
  b.rm(DIST)
  b.rm(TMP)
}).describe('removes all generated files and folders.')

b.task('build', ['clean', 'build:assets', 'build:demo', 'build:plugin'])
  .describe('builds the library bundle.')

b.task('default', ['build'])

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
  b.copy('./node_modules/substance-texture/dist', path.join(DIST, 'texture'))
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
