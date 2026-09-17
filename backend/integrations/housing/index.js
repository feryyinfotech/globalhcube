"use strict";
/**
 * Housing.com Broker CRM Integration
 * -----------------------------------
 * Docs: Broker_CRM_Integration_Document
 *
 * Flow:
 *  1. Generate HMAC-SHA256 hash of current epoch time using the secret key (K).
 *  2. Call GET /api/v0/get-broker-leads with start_date, end_date, current_time, hash, id.
 *  3. Map each returned lead to our `lead_basic_details` schema (match project by name,
 *     skip if no matching project, skip if already imported).
 *  4. Insert new leads, tagged with a "Housing.com" lead_source row.
 *
 * IMPORTANT: HOUSING_API_KEY must live only in `.env` (never committed / never hardcoded).
 */

const crypto = require("crypto");
const axios = require("axios");
const { queryDb } = require("../../helper/utilityHelper");

const HOUSING_API_URL =
  process.env.HOUSING_API_URL ||
  "https://pahal.housing.com/api/v0/get-broker-leads";
const HOUSING_API_KEY = process.env.HOUSING_API_KEY;
const HOUSING_ACCOUNT_ID = process.env.HOUSING_ACCOUNT_ID;
const HOUSING_FLAT_IDS = process.env.HOUSING_FLAT_IDS || ""; // optional, comma separated
const HOUSING_LEAD_SOURCE_NAME = "Housing.com";

/**
 * Step 2 in the doc's workflow: Hash(H) = HMAC_SHA256(K, T)
 * @param {string|number} currentTime epoch seconds, sent as string
 */
function generateHash(currentTime) {
  if (!HOUSING_API_KEY) {
    throw new Error(
      "HOUSING_API_KEY is not set. Add it to backend/.env (never hardcode it)."
    );
  }
  return crypto
    .createHmac("sha256", HOUSING_API_KEY)
    .update(String(currentTime))
    .digest("hex");
}

/**
 * Calls Housing.com's get-broker-leads API for the given epoch time window.
 * Throws on transport/auth errors; returns [] if API reports no leads.
 */
async function fetchHousingBrokerLeads({
  start_date,
  end_date,
  per_page = 1000,
  flat_ids,
} = {}) {
  if (!HOUSING_ACCOUNT_ID) {
    throw new Error(
      "HOUSING_ACCOUNT_ID is not set. Add it to backend/.env."
    );
  }

  // current_time must be generated right before the call — API rejects
  // requests where (server_receive_time - current_time) > 15 minutes.
  const currentTime = Math.floor(Date.now() / 1000);
  const hash = generateHash(currentTime);

  const params = {
    start_date,
    end_date,
    current_time: currentTime,
    hash,
    id: HOUSING_ACCOUNT_ID,
    per_page,
  };

  const resolvedFlatIds = flat_ids || HOUSING_FLAT_IDS;
  if (resolvedFlatIds) params.flat_ids = resolvedFlatIds;

  try {
    const response = await axios.get(HOUSING_API_URL, {
      params,
      timeout: 15000,
    });
    // Success responses are wrapped in `data`
    return response?.data?.data || [];
  } catch (err) {
    // Failure responses are wrapped in `apiErrors`
    const apiErrors = err?.response?.data?.apiErrors;
    const message = apiErrors
      ? JSON.stringify(apiErrors)
      : err.message || "Housing.com API request failed";
    throw new Error(`Housing.com API error: ${message}`);
  }
}

/** Finds (or creates) the "Housing.com" row in lead_source, returns ld_src_id */
async function resolveHousingLeadSourceId() {
  const existing = await queryDb(
    "SELECT `ld_src_id` FROM `lead_source` WHERE `ld_src_name` = ? LIMIT 1;",
    [HOUSING_LEAD_SOURCE_NAME]
  );
  if (existing?.length) return existing[0].ld_src_id;

  await queryDb(
    "INSERT INTO `lead_source`(`ld_src_name`,`ld_src_desc`) VALUES(?,?);",
    [HOUSING_LEAD_SOURCE_NAME, "Auto-created for Housing.com CRM API leads"]
  );
  const created = await queryDb(
    "SELECT `ld_src_id` FROM `lead_source` WHERE `ld_src_name` = ? LIMIT 1;",
    [HOUSING_LEAD_SOURCE_NAME]
  );
  return created?.[0]?.ld_src_id;
}

/** Loads active projects once per sync run for name-based matching */
async function loadActiveProjects() {
  return queryDb(
    "SELECT `pro_id`,`pro_title` FROM `project_details` WHERE `pro_status` = 1;",
    []
  );
}

function matchProject(projects, housingProjectName) {
  const target = String(housingProjectName || "").trim().toLowerCase();
  if (!target) return null;
  return (
    projects.find((p) => String(p.pro_title || "").trim().toLowerCase() === target) ||
    null
  );
}

/**
 * Creates a new active project_details row for a Housing.com project_name we
 * haven't seen before, so leads for it are never skipped. Also appends it to
 * the in-memory `projects` list so later leads in the same sync run reuse it
 * instead of creating duplicates.
 */
async function createProjectFromHousingName(projects, projectName) {
  const title = String(projectName || "").trim();
  const proUniqueId = "PRO" + randomLeadUniqueId().replace("LEAD", "");
  await queryDb(
    "INSERT INTO `project_details`(pro_unique_id,`pro_title`, `pro_sort_description`, `pro_full_description`, `pro_image`) VALUES (?,?, ?, ?, ?);",
    [proUniqueId, title, "Auto-created from Housing.com lead sync", "", ""]
  );
  const created = await queryDb(
    "SELECT `pro_id`,`pro_title` FROM `project_details` WHERE `pro_unique_id` = ? LIMIT 1;",
    [proUniqueId]
  );
  const newProject = created?.[0];
  if (newProject) projects.push(newProject);
  return newProject;
}

function randomLeadUniqueId() {
  const numeric = "1234567890";
  let ans = "";
  for (let i = 10; i > 0; i--) ans += numeric[Math.floor(Math.random() * numeric.length)];
  return "LEAD" + ans;
}

/**
 * Runs one full sync: fetch from Housing.com, map, dedupe, insert.
 * Returns a summary object — never throws for per-lead issues (those go into `skipped`),
 * but does throw if the API call itself fails.
 */
async function syncHousingLeads({ start_date, end_date, per_page, flat_ids } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const resolvedStart = start_date || now - 24 * 60 * 60; // default lookback: 24h
  const resolvedEnd = end_date || now;

  const leads = await fetchHousingBrokerLeads({
    start_date: resolvedStart,
    end_date: resolvedEnd,
    per_page,
    flat_ids,
  });

  const summary = { fetched: leads.length, inserted: 0, skipped: [], errors: [] };
  if (!leads.length) return summary;

  const ldSrcId = await resolveHousingLeadSourceId();
  const projects = await loadActiveProjects();

  for (const lead of leads) {
    try {
      const {
        lead_name,
        lead_phone,
        lead_email,
        project_id,
        flat_id,
        project_name,
        locality,
        lead_date,
        pg_name,
        service_type,
      } = lead;

      if (!lead_phone) {
        summary.skipped.push({ lead, reason: "Missing lead_phone" });
        continue;
      }

      let matchedProject = matchProject(projects, project_name);
      if (!matchedProject) {
        if (!String(project_name || "").trim()) {
          summary.skipped.push({ lead, reason: "Missing project_name, can't create a project" });
          continue;
        }
        matchedProject = await createProjectFromHousingName(projects, project_name);
      }

      // Dedupe: same phone + same project already imported => skip
      const alreadyExists = await queryDb(
        "SELECT `lead_id` FROM `lead_basic_details` WHERE `lead_mob_no` = ? AND `lead_project_id` = ? LIMIT 1;",
        [String(lead_phone), matchedProject.pro_id]
      );
      if (alreadyExists?.length) {
        summary.skipped.push({ lead, reason: "Already imported (duplicate phone+project)" });
        continue;
      }

      const notesParts = [];
      if (locality) notesParts.push(`Locality: ${locality}`);
      if (service_type) notesParts.push(`Service: ${service_type}`);
      if (pg_name) notesParts.push(`PG: ${pg_name}`);
      if (project_id || flat_id)
        notesParts.push(`Housing.com Ref: ${project_id ? `project_id=${project_id}` : `flat_id=${flat_id}`}`);
      const lead_sort_des = notesParts.join(" | ");

      await queryDb(
        `INSERT INTO \`lead_basic_details\`
          (\`lead_unique_id\`, lead_cust_name, lead_project_id, \`lead_title\`, \`lead_sort_des\`,
           \`lead_mob_no\`, \`lead_alter_mob_no\`, \`lead_email\`, \`lead_business\`, \`lead_gender\`,
           \`lead_city\`, \`lead_state\`, \`lead_country\`, \`lead_source\`, \`lead_bkt_status\`)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
        [
          randomLeadUniqueId(),
          lead_name || "",
          matchedProject.pro_id,
          project_name || matchedProject.pro_title,
          lead_sort_des,
          String(lead_phone),
          "",
          lead_email || "",
          "",
          "",
          locality || "",
          "",
          "",
          ldSrcId,
          1, // New
        ]
      );
      summary.inserted += 1;
    } catch (e) {
      summary.errors.push({ lead, error: e.message });
    }
  }

  return summary;
}

/**
 * Read-only preview — fetches leads from Housing.com WITHOUT inserting anything,
 * and returns just the distinct project_name values (plus raw leads) so you can
 * see exactly what names to create in project_details before running a real sync.
 */
async function previewHousingProjectNames({ start_date, end_date, per_page, flat_ids } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const resolvedStart = start_date || now - 24 * 60 * 60;
  const resolvedEnd = end_date || now;

  const leads = await fetchHousingBrokerLeads({
    start_date: resolvedStart,
    end_date: resolvedEnd,
    per_page,
    flat_ids,
  });

  const distinctProjectNames = [
    ...new Set(leads.map((l) => l.project_name).filter(Boolean)),
  ];

  return { fetched: leads.length, distinctProjectNames, leads };
}

module.exports = {
  generateHash,
  fetchHousingBrokerLeads,
  syncHousingLeads,
  previewHousingProjectNames,
};
