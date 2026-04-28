<template>
  <aside class="sidebar">
    <h2 class="sidebar-title">WSL Web</h2>
    <nav class="nav">
      <router-link to="/files" class="nav-item">
        <span class="icon">📁</span>
        <span>文件管理</span>
      </router-link>
      <router-link to="/terminal" class="nav-item">
        <span class="icon">💻</span>
        <span>终端</span>
      </router-link>
      <router-link to="/github" class="nav-item">
        <span class="icon">🐙</span>
        <span>GitHub</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  background: #1e1e1e;
  color: #fff;
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.sidebar-title {
  font-size: 18px;
  margin: 0 0 24px 0;
  color: #fff;
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: #ccc;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.2s;
}
.nav-item:hover {
  background: #2a2a2a;
  color: #fff;
}
.nav-item.router-link-active {
  background: #0066cc;
  color: #fff;
}
.icon {
  font-size: 18px;
}
</style>
