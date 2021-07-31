let GridIndex = require('./GridIndex').GridIndex;
let test = require('tap').test;

test('it can add point', t => {
  const index = new GridIndex(10, 10);
  let pt = {x: 10, y: 10};
  index.add(pt);
  t.equal(pt.cell.pointCount, 1, 'one point found');
  t.equal(pt.cell.points[0], pt, 'and it is correct');
  t.end();
})

test('it can find neighbors', t => {
  const index = new GridIndex(10, 10);
  let points = [{x: 10, y: 10}, {x: 0,y: 0}, {x: 5,y: 5}, {x: 100, y: 100}];
  points.forEach(pt => index.add(pt));

  let visited = 0;
  let srcPoint = points[0];
  index.forEachNeighbor(srcPoint, other => {
    visited += 1;
  });
  t.equal(visited, 1, 'one point found');
  t.end();
})

test('it can move points', t => {
  const index = new GridIndex(10, 10);
  let points = [{x: 10, y: 10}, {x: 0,y: 0}, {x: 5,y: 5}, {x: 100, y: 100}];
  points.forEach(pt => index.add(pt));

  let visited = 0;
  let srcPoint = points[0];
  srcPoint.x =  -1;
  srcPoint.y = -1;
  index.move(srcPoint);
  index.forEachNeighbor(srcPoint, other => {
    visited += 1;
  });
  t.equal(visited, 2, 'two points should be in vicinity');
  t.end();
})
