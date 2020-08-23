// PLEASE, ignore this file. I'm just messing here. It does not represent anything
// neither it is indicative of my ability to write code :).

import BBox from './BBox';
import KDBush from 'kdbush';
import {GridIndex} from '../test/GridIndex';

// The algorithm is inspired by this paper https://ccl.northwestern.edu/2018/galan2018.pdf
// I modified a few things, and mostly using this to test ideas.
export default function nbLayout(graph, settings) {
  const random = require('ngraph.random').random(42)

  var api = {
    getNodePosition,
    step,
    setNodePosition,
    updateSettings
  };

  var degreeWeighted = true;
  var desiredWidth = 10;
  var desiredHeight = 10;
  var k1 = 0.5;
  var k2 = 0.6;
  var k3 = 0.06;
  var k4 = 0.1; // This is not part of the original paper either, Just trying to push neighbors apart
  var edgeLength = 3;
  var stepNumber = 0;
  var points;

  if (settings) {
    updateSettings(settings);
  }
  var index = new GridIndex(edgeLength);
  var nodes = new Map();
  var nodeArr = [];
  var maxDegree = 0;
  var maxAggDeg = 0;

  graph.forEachNode(function(n) {
    var nodeDeg = getDeg(n.id);
    if (nodeDeg > maxDegree) maxDegree = nodeDeg;
  });

  initLayout();
  
  return api;

  function updateSettings(newSettings) {
    if (!newSettings) return;
    if (Number.isFinite(newSettings.k1)) k1 = newSettings.k1;
    if (Number.isFinite(newSettings.k2)) k2 = newSettings.k2;
    if (Number.isFinite(newSettings.k3)) k3 = newSettings.k3;
    if (Number.isFinite(newSettings.k4)) k4 = newSettings.k4;
    if (Number.isFinite(newSettings.edgeLength)) edgeLength = newSettings.edgeLength;
  }

  function initLayout() {
    graph.forEachNode(function(node) {
      var pos = {
        x: (random.nextDouble() - 0.0) * desiredWidth,
        y: (random.nextDouble() - 0.0) * desiredHeight,
        incX: 0,
        incY: 0,
        incLength: 0,
        aggDeg: 0,
        id: node.id
      };
      nodes.set(node.id, pos)
      nodeArr.push(pos);
      index.add(pos);
    });

    graph.forEachLink(function(link) {
      var fromDeg = getDeg(link.fromId);
      var toDeg = getDeg(link.fromId);
      var from = nodes.get(link.fromId);
      var to = nodes.get(link.toId);

      from.aggDeg += toDeg;
      from.incLength += 1;
      to.aggDeg += fromDeg;
      to.incLength += 1;
    });

    nodes.forEach(node => {
      if (node.incLength) node.aggDeg /= node.incLength;
      if (node.aggDeg > maxAggDeg) maxAggDeg = node.aggDeg;
      node.incLength = 0;
    })
    rescale();
  }

  function getNodePosition(nodeId) {
    var p = nodes.get(nodeId);
    return p;
  }

  function setNodePosition(nodeId, x, y) {
    var pos = nodes.get(nodeId);
    pos.x = x;
    pos.y = y;
  }

  function step() {
    minimizeEdgeCrossings();
    processIncomingMessages();
    minimizeEdgeLengthDifference();
    processIncomingMessages();
    maximizeAngularResolution();
    processIncomingMessages();
    rbfMove();
    stepNumber += 1;
  }

  function rescale() {
    var bbox = new BBox();
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      currentPos.scaled = false;
      bbox.addPoint(currentPos.x, currentPos.y);
      var otherPos = nodes.get(link.toId);
      otherPos.scaled = false;
      bbox.addPoint(otherPos.x, otherPos.y);
    });

    var width = bbox.width;
    var height = bbox.height;

    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      if (!currentPos.scaled) {
        currentPos.x = ((currentPos.x - bbox.left)/width - 0.0) * desiredWidth
        currentPos.y = ((currentPos.y - bbox.top)/height - 0.0) * desiredHeight
        currentPos.scaled = true;
      }
      var otherPos = nodes.get(link.toId);
      if(!otherPos.scaled) {
        otherPos.x = ((otherPos.x - bbox.left)/width - 0.0) * desiredWidth
        otherPos.y = ((otherPos.y - bbox.top)/height - 0.0) * desiredHeight
        otherPos.scaled = true;
      }
    });
  }

  function getDeg(id) {
    var n = graph.getNode(id);
    if (n && n.links) return n.links.length;
    return 0;
  }

  function ensurePositions() {
    nodes.forEach((p, key) => {
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) return;
       throw new Error('ugh' + key)
    })
  }

  function processIncomingMessages() {
    nodes.forEach(function(pos, key) {
      pos.x = (pos.incX + pos.x)/(pos.incLength + 1);
      pos.y = (pos.incY + pos.y)/(pos.incLength + 1);
      if (Number.isNaN(pos.x)) debugger;
      pos.incLength = 0;
      pos.incX = 0;
      pos.incY = 0;
    });
  }

  function minimizeEdgeCrossings() {
    graph.forEachLink(function(link) {
      var v = nodes.get(link.fromId);
      var u = nodes.get(link.toId);
      var dx = u.x - v.x;
      var dy = u.y - v.y;

      v.incX += v.x + k1 * dx;
      v.incY += v.y + k1 * dy;

      u.incX += u.x - k1 * dx;
      u.incY += u.y - k1 * dy;

      u.incLength += 1;
      v.incLength += 1;
    });

  }

  function minimizeEdgeLengthDifference() {
    let desLength = edgeLength;

    graph.forEachLink(function(link) {
      var u = nodes.get(link.fromId);
      var v = nodes.get(link.toId);
      var dx = v.x - u.x;
      var dy = v.y - u.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      while (l < 1e-10) {
        dx = (random.nextDouble() - 0.5);
        dx = (random.nextDouble() - 0.5);
        l = Math.sqrt(dx * dx + dy * dy);
      }
      dx /= l;
      dy /= l;

      v.incX += v.x + k2 * (desLength - l) * dx;
      v.incY += v.y + k2 * (desLength - l) * dy;
      v.incLength += 1;

      u.incX += u.x - k2 * (desLength - l) * dx;
      u.incY += u.y - k2 * (desLength - l) * dy;
      u.incLength += 1;
    });
  }

  function maximizeAngularResolution() {
    if (k3 === 0) return;

    graph.forEachNode(function(node) {
      var currentPos = nodes.get(node.id);
      currentPos.moved = 0;
    });

    graph.forEachNode(function(node) {
      var currentPos = nodes.get(node.id);
      var neighbors = [];
      //if (!currentPos.direction) {
        currentPos.direction = random.nextDouble() > 0.5 ? 1 : -1;
      // }
      //if (random.nextDouble() < 0.9) return;

      graph.forEachLinkedNode(node.id, function(other) {
        var otherPos = nodes.get(other.id);
        var dx = otherPos.x - currentPos.x;
        var dy = otherPos.y - currentPos.y;
        var angle = Math.atan2(dy, dx) + Math.PI; // 0 .. 2*Pi
        neighbors.push({
          pos: otherPos,
          angle,
        });
      });
      if (neighbors.length < 2) return;
      var direction = currentPos.direction;//random.nextDouble() > 0.5 ? 1 : -1;
      neighbors.sort((a, b) => (a.angle - b.angle));

      var desiredAngle = 2 * Math.PI / neighbors.length;

      var idx = 0;
      let startFrom = 0;//Math.floor(random.nextDouble() * neighbors.length);
      while (idx < neighbors.length) {
        var i = (startFrom + idx) % neighbors.length;
        var curr = neighbors[i];
        idx += 1;
        var next, curAngle;
        var nextIndex = i + direction;
        if (nextIndex === neighbors.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = neighbors.length - 1;

        next = neighbors[nextIndex];
        curAngle = (next.angle - curr.angle) * direction;

        if (curAngle < 0) curAngle += 2 * Math.PI;

        var otherPos = curr.pos;
        if (curAngle < desiredAngle){
          otherPos.incX += otherPos.x;
          otherPos.incY += otherPos.y;
          otherPos.incLength += 1;
          continue;
        }

        var newAngle = k3 * (curAngle - desiredAngle) * direction;
        //curr.angle = newAngle;
        var rPoint = rotate(currentPos, otherPos, newAngle);
        otherPos.incX += rPoint.x;// - otherPos.x;
        otherPos.incY += rPoint.y;// - otherPos.y;
        otherPos.incLength += 1;
        otherPos.moved = true;
      }
    });
  }

  function rotate(center, point, alpha) {
    var x = point.x - center.x;
    var y = point.y - center.y;

    var nx = Math.cos(alpha) * x - Math.sin(alpha) * y;
    var ny = Math.sin(alpha) * x + Math.cos(alpha) * y;

    return {
      x: nx + center.x,
      y: ny + center.y
    }
  }

  function rbfMove() {
    points = new KDBush(nodeArr, p => p.x, p => p.y);
    nodeArr.forEach((pos, idx) => {
      var sx = 0, sy = 0, count = 0;
      var neighbors = points.within(pos.x, pos.y, edgeLength);
      neighbors.forEach(otherIndex => {
        if (otherIndex === idx) return;

        var other = nodeArr[otherIndex];
        var dx = pos.x - other.x;
        var dy = pos.y - other.y;
        var l = Math.sqrt(dx * dx + dy * dy);

        while (l < 1e-10) {
          dx = (random.nextDouble() - 0.5);
          dx = (random.nextDouble() - 0.5);
          l = Math.sqrt(dx * dx + dy * dy);
        }
        var nx = dx/(l)
        var ny = dy/(l)

        sx += nx * edgeLength;
        sy += ny * edgeLength;
        count += 1;
      });
      if (count === 0) return;

      pos.incX = k4 * sx/count;
      pos.incY = k4 * sy/count;
      pos.incLength = 0;
    });

    processIncomingMessages();
  }

}

function rbf(r, eps = 0.008) {
  //return 1./(1 + Math.abs(r));
  //return 1./(1 + r * r);
  return Math.exp(-r * r * eps);
}