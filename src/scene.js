import appState from './appState';
import BBox from './BBox';
import createLayout from './nbLayout';
import PointCollection from './PointCollection'
import LineCollection from './LineCollection'

var wgl = require('w-gl');

export default function createScene(canvas) {
  var scene = wgl.scene(canvas);
  var graph = appState.getGraph();
  var layout = createLayout(graph, cleanUpSettings(appState.settings));
  var renderCtx;
  var frameNumber = 0;

  scene.setClearColor(12/255, 41/255, 82/255, 1)

  initSceneWithGraph(graph);
  var nextFrame = requestAnimationFrame(frame)

  return {
    dispose,
    updateLayoutParam
  };

  function updateLayoutParam(settings) {
    layout.updateSettings(cleanUpSettings(settings));
  }

  function cleanUpSettings(unsafeSettings) {
    var s = {};
    var k1 = parseFloat(unsafeSettings.k1);
    if (Number.isFinite(k1)) s.k1 = k1;

    var k2 = parseFloat(unsafeSettings.k2);
    if (Number.isFinite(k2)) s.k2 = k2;

    var k3 = parseFloat(unsafeSettings.k3);
    if (Number.isFinite(k3)) s.k3 = k3;

    var k4 = parseFloat(unsafeSettings.k4);
    if (Number.isFinite(k4)) s.k4 = k4;
    return s;
  }

  function dispose() {
    scene.dispose();
    cancelAnimationFrame(nextFrame);
  }

  function frame() {
    nextFrame = requestAnimationFrame(frame);
    layout.step();
    renderCtx.updatePosition();

    scene.renderFrame();
    //if ((frameNumber % 100) === 0) {
    // setViewBoxToFitGraph(graph);
    //}
    frameNumber += 1;
  }

  function initSceneWithGraph(graph) {
    setViewBoxToFitGraph(graph);
    renderCtx = initNodesAndEdges();

    scene.appendChild(renderCtx.lines);
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
    bbox.growBy(bbox.width * 0.1)
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
    let nodes = new PointCollection(scene.getGL(), {
      capacity: graph.getNodesCount()
    });
    let nodeIdToUI = new Map();
    let linkIdToUI = new Map();

    graph.forEachNode(node => {
      var point = layout.getNodePosition(node.id);
      let size = 0.1;
      if (node.data && node.data.size) {
        size = node.data.size;
      } else {
        if (!node.data) node.data = {};
        node.data.size = size;
      }
      node.ui = {size, position: [point.x, point.y, point.z || 0], color: node.data.color || 0x72f8fcff};
      node.uiId = nodes.add(node.ui);
    });

    let lines = new LineCollection(scene.getGL(), { capacity: graph.getLinksCount() });

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from: [from.x, from.y, from.z || 0], to: [to.x, to.y, to.z || 0], color: 0xFFFFFF10 };
      link.ui = line;
      link.uiId = lines.add(link.ui);
    });
    // let edges = new wgl.WireCollection(graph.getLinksCount());
    // edges.color.r = 6/255;
    // edges.color.g = 255/255;
    // edges.color.b = 70/255;
    // edges.color.a = 0.2;

    // graph.forEachLink(link => {
    //   var from = layout.getNodePosition(link.fromId);
    //   var to = layout.getNodePosition(link.toId);
    //   var ui = edges.add({ from, to });
    //   linkIdToUI.set(link.id, ui);
    // });

    return {
      nodes,
      lines,
      updatePosition
    };

    function updatePosition() {
      graph.forEachNode(node => {
        var pos = layout.getNodePosition(node.id);
        let uiPosition = node.ui.position;
        uiPosition[0] = pos.x;
        uiPosition[1] = pos.y;
        nodes.update(node.uiId, node.ui)
      });

      graph.forEachLink(link => {
        var fromPos = layout.getNodePosition(link.fromId);
        var toPos = layout.getNodePosition(link.toId);
        let {from, to} = link.ui;
        from[0] = fromPos.x; from[1] = fromPos.y; from[2] = fromPos.z || 0;
        to[0] = toPos.x; to[1] = toPos.y; to[2] = toPos.z || 0;
        lines.update(link.uiId, link.ui);
      })
    }
  }
}