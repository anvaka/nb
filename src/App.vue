<template>
  <div id="app">
  </div>
</template>

<script>
import createScene from './scene.js';

export default {
  name: 'App',
  components: {
  },
  mounted() {
    this.scene = createScene(document.querySelector('.scene'))
  },
  beforeDestroy() {
    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }
  }

}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
