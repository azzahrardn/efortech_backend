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

let db;
if (admin.apps.length) {
  db = admin.firestore();
}

module.exports = { db, initializeFirebase };
