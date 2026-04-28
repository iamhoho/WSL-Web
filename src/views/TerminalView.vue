<template>
  <div class="terminal-view">
    <div class="terminal-header">
      <div class="terminal-title">
        <Terminal :size="16" />
        <span>终端</span>
      </div>
      <div class="terminal-actions">
        <div class="connection-indicator" :class="{ connected: isConnected, disconnected: !isConnected }">
          <span class="indicator-dot"></span>
          <span>{{ isConnected ? '已连接' : '未连接' }}</span>
        </div>
        <button @click="reconnect" class="icon-btn" title="重连">
          <RefreshCw :size="14" :class="{ spinning: isReconnecting }" />
        </button>
      </div>
    </div>

    <div ref="terminalRef" class="terminal-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Terminal, RefreshCw } from 'lucide-vue-next';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

const terminalRef = ref(null);
const isConnected = ref(false);
const isReconnecting = ref(false);
let terminal = null;
let fitAddon = null;
let socket = null;

function connect() {
  if (socket) {
    socket.disconnect();
  }

  socket = io('/', { autoConnect: false });

  socket.on('connect', () => {
    isConnected.value = true;
    isReconnecting.value = false;
    terminal.write('\r\n\x1b[36m[连接成功] 正在启动 bash...\x1b[0m\r\n');
    socket.emit('terminal:start', {
      shell: '/bin/bash',
      cwd: '/home/dangyeuihou',
    });
  });

  socket.on('disconnect', () => {
    isConnected.value = false;
    terminal.write('\r\n\x1b[33m[连接已断开]\x1b[0m\r\n');
  });

  socket.on('terminal:data', ({ data }) => {
    terminal.write(data);
  });

  socket.on('terminal:exit', ({ exitCode, signal }) => {
    isConnected.value = false;
    terminal.write(`\r\n\x1b[31m[进程退出] exit code: ${exitCode}\x1b[0m\r\n`);
    if (signal) {
      terminal.write(`\x1b[31m[信号: ${signal}]\x1b[0m\r\n`);
    }
  });

  socket.on('terminal:error', ({ error }) => {
    terminal.write(`\r\n\x1b[31m[错误] ${error}\x1b[0m\r\n`);
  });

  socket.connect();
}

function reconnect() {
  isReconnecting.value = true;
  if (terminal) {
    terminal.clear();
    terminal.write('\x1b[36m正在重连...\x1b[0m\r\n');
  }
  connect();
}

onMounted(() => {
  terminal = new XTerminal({
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

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  terminal.open(terminalRef.value);
  fitAddon.fit();

  terminal.write('\x1b[36mWSL Terminal\x1b[0m\r\n');
  terminal.write('正在连接服务器...\r\n');

  connect();

  terminal.onResize(({ cols, rows }) => {
    if (socket?.connected) {
      socket.emit('terminal:resize', { cols, rows });
    }
  });

  window.addEventListener('resize', handleResize);
});

function handleResize() {
  if (fitAddon) {
    fitAddon.fit();
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (socket) {
    socket.disconnect();
  }
  if (terminal) {
    terminal.dispose();
  }
});
</script>

<style scoped>
.terminal-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0d1117;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #161b22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.terminal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e0e0e0;
  font-size: 14px;
  font-weight: 500;
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
  color: #e0e0e0;
}

.terminal-container {
  flex: 1;
  padding: 8px;
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
  padding: 4px;
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
