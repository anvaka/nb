// PLEASE, ignore this file. I'm just messing here. It does not represent anything
// neither it is indicative of my ability to write code :).

import BBox from './BBox';

export default function nbLayout(graph) {
  const random = require('ngraph.random').random(42)

  var api = {
    getNodePosition,
    step,
    setNodePosition
  };

  var desiredWidth = 3000;
  var desiredHeight = 3000;
  var ik1 = 0.5;
  var ik2 = 0.6;
  var ik3 = 0.06;
  var current = 0;
  var edgeLength = 100;

  var r, k1, k2, k3;
  var nodes = new Map();
  var maxDegree = 0;
  var maxAggDeg = 0;
  graph.forEachNode(function(n) {
    var nodeDeg = getDeg(n.id);
    if (nodeDeg > maxDegree) maxDegree = nodeDeg;
  });
  initLayout();
  
  return api;

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
    // return {
    //   x: p.x,
    //   y: p.y
    // }
  }

  function setNodePosition(nodeId, x, y) {
    var pos = nodes.get(nodeId);
    pos.x = x;
    pos.y = y;
  }

  function step() {
    r = 1;//1 - current/settings.steps;
    k1 = r * ik1;
    k2 = r * ik2;
    k3 = r * ik3;
    current += 1;
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
      toPos.incX += toPos.x + k2 * (desLength - l) * dx/l * tR;
      toPos.incY += toPos.y + k2 * (desLength - l) * dy/l * tR;
      toPos.incLength += 1;

      var fromDeg = getDeg(link.toId);
      var tF = fromDeg/maxDegree;
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
      // //1;//
      var ascending = node.ascending; // Math.random() > 0.50;
       neighbors.sort((a, b) => a.angle - b.angle);

      var dangle = 2 * Math.PI / neighbors.length;

      if (ascending) {
        for (var i = 0; i < neighbors.length; ++i) {
          var curr = neighbors[i];
          var next, curAngle;
          if (i === neighbors.length - 1) {
            next = neighbors[0]; 
            curAngle = 2 * Math.PI - curr.angle + next.angle; 
          } else {
            next = neighbors[i + 1];
            curAngle = next.angle - curr.angle;
          }

          if(Math.abs(curAngle) < dangle) continue;

          var otherPos = curr.pos;
          var newAngle = curr.strength * k3 * (curAngle - dangle)
          var rPoint = rotate(currentPos, otherPos, newAngle);
          otherPos.incX += rPoint.x;
          otherPos.incY += rPoint.y;
          otherPos.incLength += 1;
        }
      } else {
        for (var i = neighbors.length - 1; i >= 0; --i) {
          var curr = neighbors[i];
          var next, curAngle;
          if (i === 0) {
            next = neighbors[neighbors.length - 1]; 
            curAngle = curr.angle + 2 * Math.PI - next.angle; 
          } else {
            next = neighbors[i - 1];
            curAngle = curr.angle - next.angle;
          }

          if (curAngle < dangle) continue;

          var otherPos = curr.pos;
          var newAngle = curr.strength * k3 * (-curAngle + dangle)
          var rPoint = rotate(currentPos, otherPos, newAngle);
          otherPos.incX += rPoint.x;
          otherPos.incY += rPoint.y;
          otherPos.incLength += 1;
        }
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