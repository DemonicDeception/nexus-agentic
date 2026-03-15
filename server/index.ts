import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Orchestrator } from './orchestrator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());

// In production, serve the built frontend
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: '*' },
});

const orchestrator = new Orchestrator(io);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// SPA fallback — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, () => {
  console.log(`[NEXUS] Server running on port ${PORT}`);
  orchestrator.initialize();
});
