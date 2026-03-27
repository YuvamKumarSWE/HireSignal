import admin from 'firebase-admin';

let initialized = false;

export function initFirebase() {
  if (initialized) return;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    console.warn('FIREBASE_SERVICE_ACCOUNT not set — Firestore and auth verification disabled');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount))
  });

  admin.firestore().settings({ ignoreUndefinedProperties: true });

  initialized = true;
  console.log('Firebase Admin initialized');
}

export function getFirestore() {
  if (!initialized) return null;
  return admin.firestore();
}

export function getAuth() {
  if (!initialized) return null;
  return admin.auth();
}
