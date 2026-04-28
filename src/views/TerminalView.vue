<template>
  <div class="terminal-view">
    <div ref="terminalRef" class="terminal-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

const terminalRef = ref(null);
let terminal = null;
let fitAddon = null;
let socket = null;

onMounted(() => {
  terminal = new Terminal({ cursorBlink: true });
  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  terminal.open(terminalRef.value);
  fitAddon.fit();

  socket = io('/', { autoConnect: false });

  socket.on('connect', () => {
    terminal.write('Connected to WSL terminal\r\n');
    socket.emit('terminal:start', {
      shell: '/bin/bash',
      cwd: process.env.HOME || '/home',
    });
  });

  socket.on('terminal:data', ({ data }) => {
    terminal.write(data);
  });

  socket.on('terminal:exit', ({ exitCode, signal }) => {
    terminal.write(`\r\n[Process exited with code ${exitCode}]\r\n`);
    if (signal) {
      terminal.write(`[Signal: ${signal}]\r\n`);
    }
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
  background: #0c0c0c;
  padding: 8px;
}
.terminal-container {
  height: 100%;
  width: 100%;
}
</style>

<style>
.xterm {
  height: 100%;
}
</style>
