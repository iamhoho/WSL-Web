import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import filesRouter from './routes/files.js';
import githubRouter from './routes/github.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
}));

app.use('/api/files', filesRouter);
app.use('/api/github', githubRouter);
app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
