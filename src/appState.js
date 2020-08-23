const gen = require('ngraph.generators');
const createGraph = require('ngraph.graph');
import loadGraph from './loadGraph';
import bus from './bus';

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