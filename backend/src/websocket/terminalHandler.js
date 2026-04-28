import nodePty from 'node-pty';
import os from 'os';

const sessions = new Map();

export function handleTerminalConnection(io, socket) {
  socket.on('terminal:start', ({ shell, cwd } = {}) => {
    const homeDir = os.homedir();
    const defaultShell = shell || process.env.SHELL || '/bin/bash';
    const defaultCwd = cwd || homeDir;

    const pty = nodePty.spawn(defaultShell, [], {
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
      socket.emit('terminal:exit', { exitCode, signal });
      sessions.delete(socket.id);
    });
  });

  socket.on('terminal:input', ({ data }) => {
    sessions.get(socket.id)?.pty.write(data);
  });

  socket.on('terminal:resize', ({ cols, rows }) => {
    sessions.get(socket.id)?.pty.resize(cols, rows);
  });

  socket.on('disconnect', () => {
    const session = sessions.get(socket.id);
    if (session) {
      session.pty.kill();
      sessions.delete(socket.id);
    }
  });
}
