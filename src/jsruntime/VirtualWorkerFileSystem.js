export default class VirtualWorkerFileSystem {
  constructor () {
    this._files = new Map()
  }

  readFile (path) {
    let data = this._files.get(path)
    if (!data) {
      throw new Error('File not found: ' + path)
    } else {
      return data
    }
  }

  writeFile (path, data) {
    this._files.set(path, data)
  }
}
