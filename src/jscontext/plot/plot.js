/* globals OffscreenCanvas */
import { Chart } from 'chart.js'
import { Table } from '../table/table.js'

const DEFAULT_SIZE = 1000

export function scatterPlot (data, options = {}) {
  if (data instanceof Table) {
    data = data._getDataRows(['x', 'y'])
  }
  let _data = { datasets: [{ data }] }
  let plotParams = Object.assign({}, options, { type: 'scatter', data: _data })
  return plot(plotParams)
}

export function plot (options = {}) {
  let width = options.width || DEFAULT_SIZE
  let height = options.height || DEFAULT_SIZE
  let chartType = options.type || 'line'
  let data = options.data || {}

  let canvas = new OffscreenCanvas(width, height)
  // HACK: Chart.js requires these to be set. I.e. this is kind of a polyfill
  canvas.clientWidth = width
  canvas.clientHeight = height

  let ctx = canvas.getContext('2d')

  let chart = new Chart(ctx, { // eslint-disable-line no-unused-vars
    type: chartType,
    data,
    options: {
      animation: null,
      scales: {
        xAxes: [{
          type: 'linear',
          position: 'bottom'
        }]
      }
    }
  })
  return canvas.convertToBlob({
    type: 'image/png'
  }).then(blob => {
    // ATTENTION: destroy the chart so that the worker's mem is clean
    chart.destroy()
    return {
      type: 'blob',
      mimeType: 'image/png',
      blob
    }
  })
}

export function demo () {
  return plot({
    data: {
      datasets: [{
        label: 'Scatter Dataset',
        data: [{
          x: -10,
          y: 0
        }, {
          x: 0,
          y: 10
        }, {
          x: 10,
          y: 5
        }]
      }]
    }
  })
}
