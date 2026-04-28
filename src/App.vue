<template>
  <div class="app">
    <LayoutSidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import LayoutSidebar from './components/Layout/Sidebar.vue';
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
}
.main-content {
  flex: 1;
  overflow: hidden;
}
</style>
