"use strict";
const cron = require("node-cron");
const { syncHousingLeads } = require("./index");

// Every 15 minutes by default. Override with HOUSING_SYNC_CRON in .env
// e.g. "*/5 * * * *" for every 5 minutes.
const SCHEDULE = process.env.HOUSING_SYNC_CRON || "*/15 * * * *";

function startHousingLeadsCron() {
  if (!process.env.HOUSING_API_KEY || !process.env.HOUSING_ACCOUNT_ID) {
    console.warn(
      "[Housing.com] HOUSING_API_KEY / HOUSING_ACCOUNT_ID missing in .env — cron sync not started."
    );
    return;
  }

  cron.schedule(SCHEDULE, async () => {
    try {
      const summary = await syncHousingLeads();
      console.log(
        `[Housing.com] Sync done: fetched=${summary.fetched}, inserted=${summary.inserted}, skipped=${summary.skipped.length}, errors=${summary.errors.length}`
      );
      if (summary.errors.length) {
        console.error("[Housing.com] Errors:", summary.errors);
      }
    } catch (e) {
      console.error("[Housing.com] Sync failed:", e.message);
    }
  });

  console.log(`[Housing.com] Lead sync cron scheduled: "${SCHEDULE}"`);
}

module.exports = { startHousingLeadsCron };
