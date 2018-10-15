const gen = require('ngraph.generators');
const createGraph = require('ngraph.graph');

const appState = {
  getGraph,
  settings: {
    k1: 0.99,
    k2: 1,
    k3: 0.1
  }
}

export default appState

function getGraph() {
  // var g = createGraph();
  // g.addLink('a', 'b');
  // g.addLink('a', 'c');
  // g.addLink('a', 'f');
  // g.addLink('a', 'g');
  // g.addLink('f', '1');
  // // g.addLink('f', '2');
  // // g.addLink('f', '3');
  // // g.addLink('f', '4');
  // return g;
//  return require('miserables').create();
  return gen.balancedBinTree(5); //70, 10, 4);
}