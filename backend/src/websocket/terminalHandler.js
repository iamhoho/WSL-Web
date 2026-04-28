import nodePty from 'node-pty';
import os from 'os';

const sessions = new Map();

export function handleTerminalConnection(io, socket) {
  console.log(`[Terminal] Client connected: ${socket.id}, transport: ${socket.conn.transport.name}`);

  socket.on('terminal:start', ({ shell, cwd } = {}) => {
    console.log(`[Terminal] Received terminal:start from ${socket.id}`, { shell, cwd });

    const homeDir = os.homedir();
    const defaultShell = shell || '/bin/bash';
    const defaultCwd = cwd || homeDir;

    console.log(`[Terminal] Spawning: ${defaultShell} with args [] in ${defaultCwd}`);

    try {
      const pty = nodePty.spawn(defaultShell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: defaultCwd,
        env: process.env,
      });

      sessions.set(socket.id, { pty });

      pty.onData((data) => {
        console.log(`[Terminal] PTY data to ${socket.id}:`, data.substring(0, 50));
        socket.emit('terminal:data', { data });
      });

      pty.onExit(({ exitCode, signal }) => {
        console.log(`[Terminal] PTY exited for ${socket.id}`, { exitCode, signal });
        socket.emit('terminal:exit', { exitCode, signal });
        sessions.delete(socket.id);
      });

      console.log(`[Terminal] PTY spawned successfully for ${socket.id}, pid: ${pty.pid}`);
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

  socket.on('disconnect', (reason) => {
    console.log(`[Terminal] Client disconnected: ${socket.id}, reason: ${reason}`);
    const session = sessions.get(socket.id);
    if (session) {
      session.pty.kill();
      sessions.delete(socket.id);
    }
  });
}
