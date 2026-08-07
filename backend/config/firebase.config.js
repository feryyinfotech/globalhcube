// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("../mrm-lead-firebase-adminsdk-fbsvc-18ef37a985.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
