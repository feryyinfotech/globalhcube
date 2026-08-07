const schedule = require("node-schedule");
const moment = require("moment");
const { queryDb } = require("../helper/utilityHelper");
const { sendNotificationToEmp } = require("./SendNotification");

let jobs = [];

const scheduleTask = async () => {
  // Cancel all previous jobs
  jobs.forEach((job) => job.cancel());
  jobs = [];

  const scheduleData = await queryDb(
    "SELECT j.*,l.*,`lgn_fcm_token` FROM `schedule_job` AS j INNER JOIN  `emp_registration_details` AS e ON e.`emp_id` = j.`emp_id` INNER JOIN `emp_login` ON `lgn_id` = e.`emp_lgn_id` INNER JOIN `lead_basic_details` AS l ON j.`lead_id` = l.`lead_id` WHERE `isProcessed` = 1;",
    []
  );

  if (!Array.isArray(scheduleData) || scheduleData.length === 0) {
    console.log("⚠️ No schedules found");
    return;
  }
  scheduleData.forEach((item) => {
    const jobTime = new Date(item.sch_time);
    if (jobTime < new Date()) return;
    // console.log(item);
    const job = schedule.scheduleJob(jobTime, () => {
      yourFunction(item);
    });

    jobs.push(job);
  });
  console.log(`✅ Scheduled ${jobs.length} jobs.`);
};

async function yourFunction(data) {
  const body = {
    type: data?.mode || "full",
    leadId: String(data?.lead_id),
    leadName: data?.lead_title || "",
    leadTitle: `Scheduled Reminder ${data?.schedule_for} At ${data?.sch_time} for Lead ${data?.lead_unique_id} with ${data?.lead_cust_name} `,
    leadDescription: data?.lead_sort_des || "",
    schedultFor: data?.schedule_for || "",
    navigateTo: data?.navigate_to || "",
  };
  await sendNotificationToEmp(data?.lgn_fcm_token, body);
  await queryDb("UPDATE schedule_job SET isProcessed = 2 WHERE sch_id = ?", [
    Number(data?.sch_id),
  ]);
}

module.exports = scheduleTask;
