class CellKey {
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }

  toString() {
    return getCellKey(this.row, this.col)
  }
}

function getCellKey(row, col) {
  return `${row},${col}`;
}

class Cell {
  constructor(parent, cellKey) {
    this.parent = parent;
    this.key = cellKey;
    this.pointCount = 0;
    this.points = [];
  }

  add(point) {
    let inCellKey = this.pointCount;
    this.pointCount += 1;

    if (this.points.length < this.pointCount) {
      this.points.push(point);
    } else {
      this.points[inCellKey] = point;
    }

    point.cell = this;
    point.inCellKey = inCellKey;
  }

  remove(point) {
    if (point.cell !== this) throw new Error('Trying to remove something that does not belong to us');
    this.pointCount -= 1;
    let last = this.points[this.pointCount];

    if (last === point) return; // consider it is gone

    last.inCellKey = point.inCellKey;
    point.inCellKey = -1;
    point.cell = null;
  }
}

class GridIndex {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  add(point) {
    let key = this.getCellKeyByPoint(point);
    let cell = this.cells.get(key.toString());
    if (!cell) {
      cell = new Cell(this, key);
      this.cells.set(key.toString(), cell)
    }
    cell.add(point);
  }

  move(point) {
    if (!point.cell) throw new Error('Cell was never indexed');

    let row = Math.floor(point.x / this.cellSize);
    let col = Math.floor(point.y / this.cellSize);
    let key = point.cell.key;
    if (row === key.row && col === row.col) return;

    point.cell.remove(point);
    this.add(point);
  }

  forEachNeighbor(point, visitor) {
    let cell = point.cell || this.getCellByCoordinates(point);
    if (!cell) return;
    let srcRow = cell.key.row - 1;
    let srcCol = cell.key.col - 1;

    for (let row = 0; row < 3; ++row) {
      for(let col = 0; col < 3; ++col) {
        let cell = this.cells.get(getCellKey(srcRow + row, srcCol + col));
        if (!cell) continue;

        let count = cell.pointCount;
        for (let i = 0; i < count; ++i) {
          let other = cell.points[i];
          if (other === point) continue;
          let dx = other.x - point.x;
          let dy = other.y - point.y;
          let l = Math.sqrt(dx * dx + dy * dy);
          if (l < this.cellSize && visitor(other) === true) return;
        }
      }
    }
  }

  getCellByCoordinates(point) {
    let cellKey = this.getCellKeyByPoint(point);
    return this.cells.get(key.toString());
  }
  
  getCellKeyByPoint(point) {
    if (!Number.isFinite(point.x)) throw new Error('point.x is not a number');
    if (!Number.isFinite(point.y)) throw new Error('point.y is not a number');
    let row = Math.floor(point.x / this.cellSize);
    let col = Math.floor(point.y / this.cellSize);

    return new CellKey(row, col);
  }
}

module.exports = {
  GridIndex
};