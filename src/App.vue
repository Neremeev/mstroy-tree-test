<script setup lang="ts">
import TreeTable from './components/TreeTable.vue';
</script>

<template>
  <main class="app">
    <h1 class="app__title">MStroy — хранилище дерева</h1>
    <TreeTable data-url="/items.json" :delay-ms="2000" />
  </main>
</template>

<style scoped>
.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}
.app__title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #222;
}
</style>