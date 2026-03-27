import { upsertUser, getUserInterviews } from '../services/user.service.js';

// POST /api/user — called by frontend right after sign-in to sync the user doc
export async function syncUser(req, res) {
  try {
    const { uid, email, name } = req.user;
    const { photoURL } = req.body;
    await upsertUser({ uid, email, name, photoURL });
    res.json({ success: true });
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
}

// GET /api/user/interviews — returns all completed interviews for the current user
export async function getMyInterviews(req, res) {
  try {
    const interviews = await getUserInterviews(req.user.uid);
    res.json({ success: true, interviews });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
}
