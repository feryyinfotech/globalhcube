// firebase.js
const admin = require("firebase-admin");

try {
  const serviceAccount = require("../mrm-lead-firebase-adminsdk-fbsvc-18ef37a985.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (e) {
  console.log("Firebase not initialized: service account file missing.");
}

module.exports = admin;
