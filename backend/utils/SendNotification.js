// sendNotification.js
const admin = require("../config/firebase.config");
const { queryDb } = require("../helper/utilityHelper");

async function sendPushNotification(token, data = {}) {
  const message = {
    token,
    data,
    android: {
      priority: "high", // Maximum priority for Android
    },
    apns: {
      headers: {
        "apns-priority": "10", // Maximum priority for iOS
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    throw error;
  }
}

async function sendNotificationToEmp(fcmZToken, data) {
  try {
    if (!fcmZToken) {
      const allTokenRows = await queryDb(
        "SELECT `lgn_fcm_token` FROM `emp_login` WHERE `lgn_status` = 1 AND `lgn_fcm_token` IS NOT NULL AND `lgn_fcm_token` <> ''",
        []
      );

      const promises = allTokenRows.map((row) =>
        sendPushNotification(row.lgn_fcm_token, data)
      );

      await Promise.all(promises);
      return "success";
    } else {
      await sendPushNotification(fcmZToken, data);
      return "success";
    }
  } catch (e) {
    console.log(e);
    return "failed";
  }
}


module.exports = { sendPushNotification, sendNotificationToEmp };
