/* globals OffscreenCanvas */
import { Chart } from 'chart.js'

const DEFAULT_SIZE = 1000

export function demo (width = DEFAULT_SIZE, height = DEFAULT_SIZE) {
  let canvas = new OffscreenCanvas(width, height)
  // HACK: Chart.js requires these to be set. I.e. this is kind of a polyfill
  canvas.clientWidth = width
  canvas.clientHeight = height

  let ctx = canvas.getContext('2d')
  let scatterChart = new Chart(ctx, { // eslint-disable-line no-unused-vars
    type: 'scatter',
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
    },
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
    scatterChart.destroy()
    return {
      type: 'blob',
      mimeType: 'image/png',
      blob
    }
  })
}
