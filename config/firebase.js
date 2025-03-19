const admin = require("firebase-admin");

function initializeFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)
      ),
    });
  }
}

initializeFirebase();

let db, auth;
if (admin.apps.length) {
  db = admin.firestore();
  auth = admin.auth();
}

module.exports = { db, auth, initializeFirebase };
