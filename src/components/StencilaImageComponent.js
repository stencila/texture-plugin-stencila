import { Component } from 'substance'

export default class StencilaImageComponent extends Component {
  dispose () {
    this._dispose()
  }

  willReceiveProps (newProps) {
    this._dispose()
    this._createBlobUrl()
  }

  render ($$) {
    return $$('img').attr('src', this._getUrl())
  }

  _createBlobUrl () {
    let blob = this.props.value.blob
    if (blob) {
      this._blobUrl = URL.createObjectURL(blob)
    }
    return this._blobUrl
  }

  _dispose () {
    if (this._blobUrl) {
      window.URL.revokeObjectURL(this._blobUrl)
      this._blobUrl = null
    }
  }

  _getUrl () {
    if (this.props.url) return this.props.url
    if (this._blobUrl) return this._blobUrl
    if (this.props.blob) {
      return this._createBlobUrl()
    }
  }
}
