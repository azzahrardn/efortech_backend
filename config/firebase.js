const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");

if (!global._firebaseAdmin) {
  global._firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL)
    ),
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = new Storage({
  credentials: JSON.parse(process.env.NEXT_PUBLIC_GOOGLE_KEY_CREDENTIAL),
});

const bucket = storage.bucket(process.env.NEXT_PUBLIC_GCS_BUCKET_NAME);

module.exports = { db, auth, storage, bucket };
