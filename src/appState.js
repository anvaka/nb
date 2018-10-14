const gen = require('ngraph.generators');

const appState = {
  getGraph,
}

export default appState

function getGraph() {
  return gen.grid(10, 10);
}