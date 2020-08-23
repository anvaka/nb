import loadGraph from './loadGraph';
import bus from './bus';
import fileDrop from './fileDrop.js';
import fromDot from 'ngraph.fromdot'
import fromJson from 'ngraph.fromjson'

const gen = require('ngraph.generators');
const createGraph = require('ngraph.graph');

var qs = require('query-state')({
  k1: 0.99,
  k2: 0.3,
  k3: 0,
  k4: 0.2,
  edgeLength: 2,
  graphName: 'Grid10',
}, {
  useSearch: true
});

// get current application state from the hash string:
var settings = qs.get();

const appState = {
  getGraph,
  setGraph,
  setNewSettings,
  graphName: settings.graphName,
  graph: null,
  settings: {
    k1: settings.k1, 
    k2: settings.k2,
    k3: settings.k3,
    k4: settings.k4 ,
    edgeLength: settings.edgeLength
  },
}

setGraph(appState.graphName);

function setNewSettings(settings) {
  qs.set(settings)
  appState.settings = settings;
}

export default appState

function setGraph(graphName) {
  loadGraph(graphName).then(graph => {
    appState.graphName = graphName;
    appState.graph = graph;
    qs.set('graphName', graphName);
    bus.fire('graph-loaded', graph)
  });
}

function getGraph() {
  return appState.graph;
}

// When they drop a `.dot` file into the browser - let's load it.
fileDrop(document.body, loadDroppedGraph);

function loadDroppedGraph(files) {
  let file = files[0];

  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onload = e => {
    let content = e.target.result;
    let graph = tryDot(content) || tryJson(content);
    if (graph) {
      appState.graph = graph;
      bus.fire('graph-loaded', graph);
    }
  }
  reader.onerror = (e) => {
    //eslint-disable-next-line
    console.log('error loading dot file: ', e)
  };

  function tryDot(fileContent) {
    try {
      return fromDot(fileContent);
    } catch (e) {
      //eslint-disable-next-line
      console.log('error loading dot file: ', e)
    }
  }
  function tryJson(fileContent) {
    try {
      return fromJson(JSON.parse(fileContent));
    } catch (e) {
      //eslint-disable-next-line
      console.log('error loading JSON: ', e)
    }
  }
}