const admin = require('firebase-admin');

// Initialize Firebase Admin (optional for MVP)
let firebaseAdmin = null;

try {
  if (process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.FIREBASE_CLIENT_EMAIL) {
    
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    firebaseAdmin = admin;
    console.log('✅ Firebase Admin initialized');
  } else {
    console.log('ℹ️  Firebase Admin not configured (optional for MVP)');
  }
} catch (error) {
  console.log('⚠️  Firebase Admin initialization failed (optional for MVP):', error.message);
}

module.exports = firebaseAdmin;
