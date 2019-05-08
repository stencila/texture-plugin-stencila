/**
 * Built-in API for dealing with CSV files.
 */

export function fromCSV (csvStr) {
  return Table.fromCSV(csvStr)
}

export class Table {
  constructor (columnNames) {
    this._columnNames = columnNames
    this.columns = new Map()
    columnNames.forEach(name => {
      this.columns.set(name, { data: [] })
    })
  }

  append (row) {
    if (row.length !== this._columnNames.length) {
      throw new Error('Invalid argument: provided data has incompatible size')
    }
    for (let idx = 0; idx < row.length; idx++) {
      let columnName = this._columnNames[idx]
      let col = this.columns.get(columnName)
      col.data.push(row[idx])
    }
  }

  // creates a new table with given columns
  select (...columnNames) {
    let newTable = new Table(columnNames)
    for (let col of columnNames) {
      newTable.columns.set(col, this.columns.get(col))
    }
    return newTable
  }

  _getDataRows (as) {
    let res = []
    let N = this.getRowCount()
    for (let idx = 0; idx < N; idx++) {
      res.push(this.getRow(idx, as))
    }
    return res
  }

  toHTML () {
    let result = []
    result.push('<table>')
    result.push('<tr>')
    this._columnNames.forEach(col => {
      result.push(`<th>${col}</th>`)
    })
    result.push('</tr>')
    let N = this.getRowCount()
    for (let idx = 0; idx < N; idx++) {
      result.push('<tr>')
      for (let name of this._columnNames) {
        let col = this.columns.get(name)
        result.push(`<td>${col.data[idx]}</td>`)
      }
      result.push('</tr>')
    }
    result.push('</table>')
    return result.join('\n')
  }

  getRowCount () {
    if (this._columnNames.length === 0) return 0
    return this.columns.get(this._columnNames[0]).data.length
  }

  getRow (rowIdx, _as) {
    let res = {}
    let N = this._columnNames.length
    for (let idx = 0; idx < N; idx++) {
      let name = this._columnNames[idx]
      let col = this.columns.get(name)
      let as = _as ? _as[idx] : name
      res[as] = col.data[rowIdx]
    }
    return res
  }

  static fromCSV (csvStr) {
    csvStr = csvStr.trim()
    let lines = csvStr.split(/\r?\n/)
    let headers = _splitLine(lines[0])
    let table = new Table(headers)
    for (let idx = 1; idx < lines.length; idx++) {
      let vals = _splitLine(lines[idx])
      vals = vals.map(val => {
        try {
          return Number(val)
        } catch (err) {
          return val
        }
      })

      table.append(vals)
    }
    return table
  }
}

const QUOTE = '"'.charCodeAt(0)

function _splitLine (lineStr) {
  let vals = lineStr.split(/\s*,\s*/)
  vals = vals.map(val => {
    val = val.trim()
    if (val.charCodeAt(0) === QUOTE) {
      val = val.slice(1, -1)
    }
    return val
  })
  return vals
}
