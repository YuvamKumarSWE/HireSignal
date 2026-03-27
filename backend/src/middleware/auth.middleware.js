import { getAuth } from '../config/firebase.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.split('Bearer ')[1];
  const auth = getAuth();

  // If Firebase Admin isn't configured, fall back to trusting the uid in the body
  // (dev-only convenience — remove this in production)
  if (!auth) {
    req.user = { uid: req.body?.userId || 'dev_user' };
    return next();
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email, name: decoded.name };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
