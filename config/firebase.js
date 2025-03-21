const admin = require("firebase-admin");

if (!global._firebaseAdmin) {
  global._firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)
    ),
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };
