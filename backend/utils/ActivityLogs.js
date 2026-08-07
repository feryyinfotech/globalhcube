// sendNotification.js
const admin = require("../config/firebase.config");
const { queryDb } = require("../helper/utilityHelper");
async function ActivityLogsFuns(emp_id, lead_id, logs_for, title, description) {
  //1> Lead Details 
  // 2> schedule
  // 3> Booking
  // 4> Lead Status
  // 5> Auth
  try {
    if (lead_id && emp_id && logs_for) {
      await queryDb(
        "INSERT INTO `leads_activity_logs`(`log_lead_id`,`log_emp_id`,log_for,`log_action_title`,`log_action_description`) VALUES(?,?,?,?,?);",
        [Number(lead_id), Number(emp_id), Number(logs_for), title, description]
      );
    }
    return;
  } catch (e) {
    console.log(e);
    return;
  }
}

module.exports = { ActivityLogsFuns };
