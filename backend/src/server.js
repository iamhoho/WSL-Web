import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './index.js';
import { handleTerminalConnection } from './websocket/terminalHandler.js';

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  handleTerminalConnection(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
