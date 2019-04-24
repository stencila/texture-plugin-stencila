import * as monaco from 'monaco-editor'
import SubstanceMonacoAdapter from './SubstanceMonacoAdapter'

const ASSET_PATH = 'lib/monaco-editor/'

__webpack_public_path__ = ASSET_PATH // eslint-disable-line camelcase, no-undef

// we have to define the location of worker scripts
// which are loaded dynamically
self.MonacoEnvironment = { // eslint-disable-line no-undef
  getWorkerUrl: function (moduleId, label) {
    if (label === 'json') {
      return ASSET_PATH + 'json.worker.js'
    }
    if (label === 'css') {
      return ASSET_PATH + 'css.worker.js'
    }
    if (label === 'html') {
      return ASSET_PATH + 'html.worker.js'
    }
    if (label === 'typescript' || label === 'javascript') {
      return ASSET_PATH + 'typescript.worker.js'
    }
    return ASSET_PATH + 'editor.worker.js'
  }
}

monaco.SubstanceMonacoAdapter = SubstanceMonacoAdapter

self.monaco = monaco // eslint-disable-line no-undef
