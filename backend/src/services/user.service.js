import { getFirestore } from '../config/firebase.js';

export async function upsertUser({ uid, email, name, photoURL }) {
  const db = getFirestore();
  if (!db) return;

  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      uid,
      email: email || null,
      displayName: name || null,
      photoURL: photoURL || null,
      createdAt: new Date()
    });
  } else {
    // Keep createdAt, just update mutable fields
    await ref.update({
      email: email || snap.data().email,
      displayName: name || snap.data().displayName,
      photoURL: photoURL || snap.data().photoURL
    });
  }
}

export async function getUserInterviews(uid) {
  const db = getFirestore();
  if (!db) return [];

  const snap = await db
    .collection('interviews')
    .where('userId', '==', uid)
    .where('status', '==', 'completed')
    .orderBy('startedAt', 'desc')
    .get();

  return snap.docs.map(doc => ({ sessionId: doc.id, ...doc.data() }));
}
