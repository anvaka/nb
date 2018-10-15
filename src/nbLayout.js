// PLEASE, ignore this file. I'm just messing here. It does not represent anything
// neither it is indicative of my ability to write code :).

import BBox from './BBox';

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

  var desiredWidth = 1300;
  var desiredHeight = 1300;
  var k1 = 0.5;
  var k2 = 0.6;
  var k3 = 0.06;
  var edgeLength = 100;

  if (settings) {
    updateSettings(settings);
  }
  var nodes = new Map();
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
  }

  function initLayout() {
    graph.forEachNode(function(node) {
      nodes.set(node.id, {
        x: (random.nextDouble() - 0.0) * desiredWidth,
        y: (random.nextDouble() - 0.0) * desiredHeight,
        incX: 0,
        incY: 0,
        incLength: 0,
        aggDeg: 0,
      })
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
    rescale();
    minimizeEdgeCrossings();
    minimizeEdgeLengthDifference();
    maximizeAngularResolution();
    ensurePositions();
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
    bbox = new BBox();
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      bbox.addPoint(currentPos.x, currentPos.y);
      var otherPos = nodes.get(link.toId);
      bbox.addPoint(otherPos.x, otherPos.y);
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
      pos.incLength = 0;
      pos.incX = 0;
      pos.incY = 0;
    });
  }

  function minimizeEdgeCrossings() {
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      var otherPos = nodes.get(link.toId);
      var dx = currentPos.x - otherPos.x;
      var dy = currentPos.y - otherPos.y;
      otherPos.incX += otherPos.x + k1 * dx;
      otherPos.incY += otherPos.y + k1 * dy;
      otherPos.incLength += 1;

      currentPos.incX += currentPos.x - k1 * dx;
      currentPos.incY += currentPos.y - k1 * dy;
      currentPos.incLength += 1;
    })
    processIncomingMessages();
  }

  function minimizeEdgeLengthDifference() {
    var desLength = 0;
    graph.forEachLink(function(link) {
      var currentPos = nodes.get(link.fromId);
      var otherPos = nodes.get(link.toId);
      var dx = otherPos.x - currentPos.x;
      var dy = otherPos.y - currentPos.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      if (l > desLength) desLength = l;
    });

    // desLength = Math.max(desLength, edgeLength);
    //console.log(desLength)
    //desLength = edgeLength;

    graph.forEachLink(function(link) {
      //currentPos -> u, otherPos -> v
      var formPos = nodes.get(link.fromId);
      var toPos = nodes.get(link.toId);
      var dx = toPos.x - formPos.x;
      var dy = toPos.y - formPos.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      var ddx, ddy;
      while (l < 1e-10) {
        dx = (random.nextDouble() - 0.5);
        dx = (random.nextDouble() - 0.5);
        l = Math.sqrt(dx * dx + dy * dy);
      }

      ddx = k2 * (desLength - l) * dx/l;
      ddy = k2 * (desLength - l) * dy/l;

      // for some reason swapping source point here works better for grid graphs
      var toDeg = getDeg(link.toId);
      var tR = toDeg/maxDegree;
      tR = 1;
      toPos.incX += toPos.x + k2 * (desLength - l) * dx/l * tR;
      toPos.incY += toPos.y + k2 * (desLength - l) * dy/l * tR;
      toPos.incLength += 1;

      var fromDeg = getDeg(link.toId);
      var tF = fromDeg/maxDegree;
      tF = 1;
      formPos.incX += formPos.x - k2 * (desLength- l) * dx/l * tF;
      formPos.incY += formPos.y - k2 * (desLength- l) * dy/l  * tF;
      formPos.incLength += 1;
    });

    processIncomingMessages();
  }

  function maximizeAngularResolution() {
    var id = 0;
    graph.forEachNode(function(node) {
      var currentPos = nodes.get(node.id);
      var neighbors = [];
      id += 1;
      graph.forEachLinkedNode(node.id, function(other) {
        var otherPos = nodes.get(other.id);
        var dx = otherPos.x - currentPos.x;
        var dy = otherPos.y - currentPos.y;
        var angle = Math.atan2(dy, dx) + Math.PI;
        var deg = getDeg(other.id);
        neighbors.push({
          pos: otherPos,
          angle,
          strength: otherPos.aggDeg/maxAggDeg
        });
      });
      if (neighbors.length < 2) return;
      if (node.ascending === undefined) {
        node.ascending = Math.random() < 0.5;
      }
      // node.ascending; //
      var ascending = node.ascending; // Math.random() > 0.50;
      neighbors.sort((a, b) => a.angle - b.angle);

      var desiredAngle = 2 * Math.PI / neighbors.length;
      var direction = ascending ? 1 : -1;

      // for (var i = 0; i < neighbors.length; ++i) {
      var idx = 0;
      var startFrom = Math.round(Math.random() * (neighbors.length - 1));
      while (idx < neighbors.length) {
        var i = (startFrom + idx) % neighbors.length;
        idx += 1;
        var curr = neighbors[i];
        var next, curAngle;
        var nextIndex = i + direction;
        if (nextIndex === neighbors.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = neighbors.length - 1;

        next = neighbors[nextIndex];
        curAngle = (next.angle - curr.angle) * direction;

        if (curAngle < 0) curAngle += 2 * Math.PI;

        if (curAngle < desiredAngle) continue;

        var otherPos = curr.pos;
        var newAngle = curr.strength * k3 * (curAngle - desiredAngle) * direction;
        var rPoint = rotate(currentPos, otherPos, newAngle);
        otherPos.incX += rPoint.x;
        otherPos.incY += rPoint.y;
        otherPos.incLength += 1;
      }
    });

    processIncomingMessages();
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
}