import { Router } from 'express';
import axios from 'axios';

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_APP_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_APP_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_APP_REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback';

router.get('/github', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo,user&state=${state}`;
  res.redirect(githubAuthUrl);
});

router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (state !== req.session.oauthState) {
    return res.status(400).json({ error: 'Invalid OAuth state' });
  }

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token } = tokenResponse.data;
    req.session.githubToken = access_token;

    res.redirect('http://localhost:5173/github/callback');
  } catch (error) {
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
});

router.get('/github/user', async (req, res) => {
  const token = req.session.githubToken;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    res.json(userResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/github/logout', (req, res) => {
  req.session.githubToken = null;
  res.json({ success: true });
});

export default router;
