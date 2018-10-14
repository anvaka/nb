import appState from './appState';
import BBox from './BBox';
import createLayout from './nbLayout';

var wgl = require('w-gl');

export default function createScene(canvas) {
  var scene = wgl.scene(canvas);
  var graph = appState.getGraph();
  var layout = createLayout(graph);
  var renderCtx;

  scene.setClearColor(12/255, 41/255, 82/255, 1)

  initSceneWithGraph(graph);
  var nextFrame = requestAnimationFrame(frame)

  return {
    dispose
  };

  function dispose() {
    scene.dispose();
    cancelAnimationFrame(nextFrame);
  }

  function frame() {
    nextFrame = requestAnimationFrame(frame);
    layout.step();
    renderCtx.updatePosition();

    scene.renderFrame();
  }

  function initSceneWithGraph(graph) {
    setViewBoxToFitGraph(graph);
    renderCtx = initNodesAndEdges();

    scene.appendChild(renderCtx.edges);
    scene.appendChild(renderCtx.nodes);
  }

  function setViewBoxToFitGraph(graph) {
    var bbox = new BBox();
    graph.forEachLink(function (link) {
      let from = layout.getNodePosition(link.fromId);
      let to = layout.getNodePosition(link.toId);
      bbox.addPoint(from.x, from.y);
      bbox.addPoint(to.x, to.y);

    });
    bbox.growBy(200)
    var dpp = window.devicePixelRatio;

    scene.setViewBox({
      left:  bbox.left/dpp,
      top:   bbox.top/dpp,
      right:  bbox.right/dpp,
      bottom: bbox.bottom/dpp,
    })
  }

  function initNodesAndEdges() {
    let nodeCount = graph.getNodesCount();
    let nodes = new wgl.PointCollection(nodeCount + 1);
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      let size = 20;
      point.size = size
      point.color = {
        r: 114/255,
        g: 248/255,
        b: 252/255
      };

      let ui = nodes.add(point, node.id);
      nodeIdToUI.set(node.id, ui);
    });

    let edges = new wgl.WireCollection(graph.getLinksCount());
    edges.color.r = 6/255;
    edges.color.g = 255/255;
    edges.color.b = 70/255;
    edges.color.a = 0.2;

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var ui = edges.add({ from, to });
      linkIdToUI.set(link.id, ui);
    });

    return {
      nodes,
      edges,
      updatePosition
    };

    function updatePosition() {
      graph.forEachNode(node => {
        var pos = layout.getNodePosition(node.id);
        nodeIdToUI.get(node.id).update(pos);
      });

      graph.forEachLink(link => {
        var fromPos = layout.getNodePosition(link.fromId);
        var toPos = layout.getNodePosition(link.toId);
        linkIdToUI.get(link.id).update(fromPos, toPos);
      })
    }
  }
}