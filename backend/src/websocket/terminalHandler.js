import nodePty from 'node-pty';
import os from 'os';
import fs from 'fs';

const sessions = new Map();

export function handleTerminalConnection(io, socket) {
  console.log(`[Terminal] Client connected: ${socket.id}`);

  socket.on('terminal:start', ({ shell, cwd } = {}) => {
    console.log(`[Terminal] Starting terminal for ${socket.id}`, { shell, cwd });

    const homeDir = os.homedir();
    const defaultShell = shell || process.env.SHELL || '/bin/bash';
    const defaultCwd = cwd || homeDir;

    console.log(`[Terminal] Spawning shell: ${defaultShell} in ${defaultCwd}`);

    try {
      const pty = nodePty.spawn(defaultShell, ['-l'], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: defaultCwd,
        env: process.env,
      });

      sessions.set(socket.id, { pty });

      pty.onData((data) => {
        socket.emit('terminal:data', { data });
      });

      pty.onExit(({ exitCode, signal }) => {
        console.log(`[Terminal] PTY exited for ${socket.id}`, { exitCode, signal });
        socket.emit('terminal:exit', { exitCode, signal });
        sessions.delete(socket.id);
      });

      console.log(`[Terminal] PTY spawned successfully for ${socket.id}`);
    } catch (error) {
      console.error(`[Terminal] Failed to spawn PTY for ${socket.id}:`, error);
      socket.emit('terminal:error', { error: error.message });
    }
  });

  socket.on('terminal:input', ({ data }) => {
    const session = sessions.get(socket.id);
    if (session) {
      session.pty.write(data);
    }
  });

  socket.on('terminal:resize', ({ cols, rows }) => {
    const session = sessions.get(socket.id);
    if (session) {
      session.pty.resize(cols, rows);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Terminal] Client disconnected: ${socket.id}`);
    const session = sessions.get(socket.id);
    if (session) {
      session.pty.kill();
      sessions.delete(socket.id);
    }
  });
}
