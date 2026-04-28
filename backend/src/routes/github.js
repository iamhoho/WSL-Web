import { Router } from 'express';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import fs from 'fs';

const router = Router();

router.post('/init', async (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath) {
    return res.status(400).json({ error: 'repoPath is required' });
  }

  try {
    await git.init({ fs, dir: repoPath });
    res.json({ success: true, message: 'Repository initialized' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/commit', async (req, res) => {
  const { repoPath, message, author } = req.body;
  if (!repoPath || !message) {
    return res.status(400).json({ error: 'repoPath and message are required' });
  }

  try {
    const token = req.session.githubToken;
    const sha = await git.commit({
      fs,
      dir: repoPath,
      message,
      author: author || { name: 'User', email: 'user@example.com' },
    });
    res.json({ success: true, sha });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', async (req, res) => {
  const { repoPath } = req.query;
  if (!repoPath) {
    return res.status(400).json({ error: 'repoPath is required' });
  }

  try {
    const matrix = await git.statusMatrix({ fs, dir: repoPath });
    const files = matrix
      .filter(([_, head, workdir, stage]) => head !== 1 || workdir !== 1 || stage !== 1)
      .map(([filepath, head, workdir, stage]) => ({
        filepath,
        head: head === 1,
        workdir: workdir === 1,
        stage: stage === 1,
      }));
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
