<template>
  <div class="terminal-view">
    <div class="terminal-tabs">
      <div class="tabs-list">
        <div
          v-for="(tab, index) in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTabId === tab.id }"
          @click="switchTab(tab.id)"
        >
          <Terminal :size="14" />
          <span>{{ tab.name }}</span>
          <button
            v-if="tabs.length > 1"
            class="close-btn"
            @click.stop="closeTab(tab.id)"
          >
            <X :size="12" />
          </button>
        </div>
      </div>
      <button class="new-tab-btn" @click="createTab" title="新建终端">
        <Plus :size="16" />
      </button>
    </div>

    <div class="terminal-header">
      <div class="terminal-title">
        <Terminal :size="16" />
        <span>终端 {{ activeTab?.name }}</span>
      </div>
      <div class="terminal-actions">
        <div class="connection-indicator" :class="{ connected: activeTab?.connected, disconnected: !activeTab?.connected }">
          <span class="indicator-dot"></span>
          <span>{{ activeTab?.connected ? '已连接' : '未连接' }}</span>
        </div>
        <button @click="reconnect" class="icon-btn" title="重连">
          <RefreshCw :size="14" :class="{ spinning: activeTab?.reconnecting }" />
        </button>
      </div>
    </div>

    <div class="terminal-container">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :ref="el => setTerminalRef(tab.id, el)"
        class="terminal-instance"
        :class="{ active: activeTabId === tab.id }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { Terminal, RefreshCw, Plus, X } from 'lucide-vue-next';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

let tabIdCounter = 0;
const tabs = ref([]);
const activeTabId = ref(null);
const terminalRefs = ref({});
const terminals = ref({});
const fitAddons = ref({});
const sockets = ref({});

const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value));

function createTab() {
  const id = ++tabIdCounter;
  const name = `终端 ${id}`;
  tabs.value.push({
    id,
    name,
    connected: false,
    reconnecting: false,
  });
  nextTick(() => {
    initTerminal(id);
    activeTabId.value = id;
  });
}

function closeTab(id) {
  if (tabs.value.length === 1) return;

  const index = tabs.value.findIndex(t => t.id === id);
  if (index === -1) return;

  sockets.value[id]?.disconnect();
  terminals.value[id]?.dispose();
  delete terminals.value[id];
  delete fitAddons.value[id];
  delete sockets.value[id];
  delete terminalRefs.value[id];
  tabs.value.splice(index, 1);

  if (activeTabId.value === id) {
    activeTabId.value = tabs.value[Math.max(0, index - 1)].id;
  }
}

function switchTab(id) {
  activeTabId.value = id;
  nextTick(() => {
    fitAddons.value[id]?.fit();
    terminals.value[id]?.focus();
  });
}

function setTerminalRef(id, el) {
  if (el) {
    terminalRefs.value[id] = el;
  }
}

function initTerminal(id) {
  const terminal = new XTerminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 14,
    fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
    theme: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      cursor: '#00d9ff',
      cursorAccent: '#0d1117',
      selection: 'rgba(0, 217, 255, 0.3)',
      black: '#0d1117',
      red: '#f85149',
      green: '#56d364',
      yellow: '#e3b341',
      blue: '#58a6ff',
      magenta: '#bc8cff',
      cyan: '#00d9ff',
      white: '#c9d1d9',
      brightBlack: '#6e7681',
      brightRed: '#ffa198',
      brightGreen: '#aff5b4',
      brightYellow: '#f8e3a1',
      brightBlue: '#a5d6ff',
      brightMagenta: '#d2a8ff',
      brightCyan: '#67e4e5',
      brightWhite: '#ffffff',
    },
  });

  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  terminals.value[id] = terminal;
  fitAddons.value[id] = fitAddon;

  const container = terminalRefs.value[id];
  if (container) {
    terminal.open(container);
    fitAddon.fit();
  }

  terminal.write('\x1b[36mWSL Terminal\x1b[0m\r\n');
  terminal.write('正在连接服务器...\r\n');

  connect(id, terminal, fitAddon);
}

function connect(id, terminal, fitAddon) {
  if (sockets.value[id]) {
    sockets.value[id].disconnect();
  }

  const socket = io('/', { autoConnect: false });
  sockets.value[id] = socket;

  const tab = tabs.value.find(t => t.id === id);

  socket.on('connect', () => {
    tab.connected = true;
    tab.reconnecting = false;
    terminal.write('\r\n\x1b[36m[连接成功] 正在启动 bash...\x1b[0m\r\n');
    socket.emit('terminal:start', {
      shell: '/bin/bash',
      cwd: '/home/dangyeuihou',
    });
  });

  socket.on('disconnect', () => {
    tab.connected = false;
    terminal.write('\r\n\x1b[33m[连接已断开]\x1b[0m\r\n');
  });

  socket.on('terminal:data', ({ data }) => {
    terminal.write(data);
  });

  socket.on('terminal:exit', ({ exitCode, signal }) => {
    tab.connected = false;
    terminal.write(`\r\n\x1b[31m[进程退出] exit code: ${exitCode}\x1b[0m\r\n`);
    if (signal) {
      terminal.write(`\x1b[31m[信号: ${signal}]\x1b[0m\r\n`);
    }
  });

  socket.on('terminal:error', ({ error }) => {
    terminal.write(`\r\n\x1b[31m[错误] ${error}\x1b[0m\r\n`);
  });

  terminal.onData((data) => {
    if (socket.connected) {
      socket.emit('terminal:input', { data });
    }
  });

  terminal.onResize(({ cols, rows }) => {
    if (socket.connected) {
      socket.emit('terminal:resize', { cols, rows });
    }
  });

  socket.connect();
}

function reconnect() {
  const id = activeTabId.value;
  if (!id) return;

  const tab = tabs.value.find(t => t.id === id);
  tab.reconnecting = true;

  const terminal = terminals.value[id];
  terminal?.clear();
  terminal?.write('\x1b[36m正在重连...\x1b[0m\r\n');

  connect(id, terminal, fitAddons.value[id]);
}

function handleResize() {
  Object.values(fitAddons.value).forEach(addon => addon?.fit());
}

onMounted(() => {
  createTab();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  Object.values(sockets.value).forEach(socket => socket?.disconnect());
  Object.values(terminals.value).forEach(terminal => terminal?.dispose());
});
</script>

<style scoped>
.terminal-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0d1117;
}

.terminal-tabs {
  display: flex;
  align-items: center;
  background: #161b22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 8px;
}

.tabs-list {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  flex: 1;
}

.tabs-list::-webkit-scrollbar {
  height: 4px;
}

.tabs-list::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 2px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  color: #8b949e;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab:hover {
  color: #c9d1d9;
  background: rgba(255, 255, 255, 0.05);
}

.tab.active {
  color: #c9d1d9;
  border-bottom-color: #00d9ff;
  background: rgba(0, 217, 255, 0.1);
}

.tab .close-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  padding: 2px;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-left: 4px;
}

.tab .close-btn:hover {
  background: rgba(248, 81, 73, 0.3);
  color: #f85149;
}

.new-tab-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.new-tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #c9d1d9;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #0d1117;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8b949e;
  font-size: 13px;
}

.terminal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #8b949e;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6e7681;
}

.connection-indicator.connected .indicator-dot {
  background: #56d364;
  box-shadow: 0 0 8px #56d364;
}

.connection-indicator.connected {
  color: #56d364;
}

.connection-indicator.disconnected .indicator-dot {
  background: #f85149;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #c9d1d9;
}

.terminal-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.terminal-instance {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px;
  display: none;
}

.terminal-instance.active {
  display: block;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

<style>
.xterm {
  height: 100%;
}

.xterm-viewport {
  overflow-y: auto !important;
}

.xterm-viewport::-webkit-scrollbar {
  width: 8px;
}

.xterm-viewport::-webkit-scrollbar-track {
  background: #0d1117;
}

.xterm-viewport::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 4px;
}
</style>
