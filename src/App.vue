<template>
  <div id="app">
    <div class='settings'>
      <div class="folder-container">
        <div class='deco-border'></div>
        <h3>Graph settings</h3>
      </div>
      <div class="header">Select a graph</div>
      <div class='row'>
        <div class='value'>
        <select v-model='selectedGraph' :disable='loading'>
          <option v-for="graph in graphs" :key='graph' :value='graph'>{{graph}}</option>
        </select></div>
      </div>

      <div class="folder-container">
        <div class='deco-border'></div>
        <h3>Algorithm Settings</h3>
      </div>
      <div class="header">Minimize edge length (K1)</div>
      <div class='row'>
        <div class='value'><input v-model='settings.k1' type='number' step='0.1' min="0"></div>
      </div>
      <div class="footer">The closer it is to 1, the smaller the edges</div>

      <div class="header">Minimize edge length differences (K2)</div>
      <div class='row'>
        <div class='value'><input v-model='settings.k2' type='number' step='0.1' min="0"></div>
      </div>
      <div class="footer">
        The closer it is to 1, the stronger is the push towards desired edge length
      </div>

      <div class="header">Maximize angular resolution (K3)</div>
      <div class='row'>
        <div class='value'><input v-model='settings.k3' type='number' step='0.1' min="0"></div>
      </div>
      <div class="footer">
        The closer it is to 1, the stronger is the push to place edges around the circle
      </div>
      <div class='row'>
        <div class='label'>K4 ()</div>
        <div class='value'><input v-model='settings.k4'></div>
      </div>
    </div>

    <a href="#" @click.prevent='reset'>Reset</a>
  </div>
</template>

<script>
import createScene from './scene.js';
import appState from './appState.js';
import loadGraph from './loadGraph';
import getAvailableGraphs from './getAvailableGraphs';


export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      settings: appState.settings,
      loading: false,
      graphs: getAvailableGraphs(),
      selectedGraph: 'Grid10'
    };
  },
  mounted() {
    this.scene = createScene(document.querySelector('.scene'))
  },
  watch: {
    'settings.k1': function(newValue, oldValue) {
      this.scene.updateLayoutParam(this.settings);
    },
    'settings.k2': function(newValue, oldValue) {
      this.scene.updateLayoutParam(this.settings);
    },
    'settings.k3': function(newValue, oldValue) {
      this.scene.updateLayoutParam(this.settings);
    },
    'settings.k4': function(newValue, oldValue) {
      this.scene.updateLayoutParam(this.settings);
    },
    selectedGraph(newGraph) {
      loadGraph(newGraph).then(x => {
        this.scene.dispose();
        appState.setGraph(x);
        this.scene = createScene(document.querySelector('.scene'));
      });
    }
  },
  beforeDestroy() {
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
  },
  methods: {
    updateK3() {
      console.log('k3');
    },
    reset() {
      this.scene.dispose();
      this.scene = createScene(document.querySelector('.scene'));
    }
  }

}
</script>

<style lang='stylus'>
background-color = #0D2647;

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  position: absolute;
  color: rgb(244, 244, 244);
}
a {
  color: rgb(244, 244, 244);
  text-decoration: none;
  border-bottom: 1px dashed;
}

.folder-container {
  position: relative;
  display: flex;
  justify-content: center;
  .deco-border {
    position: absolute;
    left: 0;
    top: 8px;
    width: 100%;
    border-bottom: 1px solid #39a;
  }
  h3 {
    top: 0;
    font-size: 14px;
    position relative
    margin: 0;
    font-weight: normal;
    background-color: background-color;
    padding: 0 8px;
  }
}
.settings {
  padding: 8px;
  max-width: 320px;
  background: background-color;
}
.header {
  text-align: right;
  font-size: 18px;
  padding-bottom: 4px;
}
.footer {
  padding-top: 8px;
  border-bottom: 1px solid;
  font-size: 12px;
  margin-bottom: 8px;
  padding-bottom: 8px;
}
.row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.row .label {
  width: 100px;
}
.row .value {
  flex: 1;
}
.row .value input[type='number']{
  width: 100%;
}
.row select {
  width: 100%;
}
</style>
