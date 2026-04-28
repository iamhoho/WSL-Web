<template>
  <aside class="sidebar">
    <div class="logo">
      <Terminal class="logo-icon" :size="24" />
      <h2 class="logo-text">WSL Web</h2>
    </div>

    <nav class="nav">
      <router-link to="/files" class="nav-item" active-class="active">
        <FolderOpen :size="20" />
        <span>文件管理</span>
      </router-link>
      <router-link to="/terminal" class="nav-item" active-class="active">
        <Terminal :size="20" />
        <span>终端</span>
      </router-link>
      <router-link to="/github" class="nav-item" active-class="active">
        <Github :size="20" />
        <span>GitHub</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="connection-status" :class="{ online: isBackendOnline }">
        <span class="status-dot"></span>
        <span>{{ isBackendOnline ? '后端已连接' : '后端离线' }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Terminal, FolderOpen, Github } from 'lucide-vue-next';
import axios from 'axios';

const isBackendOnline = ref(false);

async function checkBackend() {
  try {
    await axios.get('/api/health', { timeout: 2000 });
    isBackendOnline.value = true;
  } catch {
    isBackendOnline.value = false;
  }
}

onMounted(() => {
  checkBackend();
  setInterval(checkBackend, 30000);
});
</script>

<style scoped>
.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin-bottom: 32px;
}

.logo-icon {
  color: #00d9ff;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #00d9ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #a0a0a0;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(0, 217, 255, 0.15), rgba(0, 255, 136, 0.1));
  color: #00d9ff;
  border-left: 3px solid #00d9ff;
}

.nav-item svg {
  flex-shrink: 0;
}

.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
  padding: 8px 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4757;
  animation: pulse 2s infinite;
}

.connection-status.online .status-dot {
  background: #00ff88;
}

.connection-status.online {
  color: #00ff88;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
