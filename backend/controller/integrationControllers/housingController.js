"use strict";
const { apiResponse } = require("../../helper/helperResponse");
const {
  syncHousingLeads,
  previewHousingProjectNames,
} = require("../../integrations/housing");

// GET /api/v1/housing-leads-preview?start_date=&end_date=
// Read-only: does NOT insert into DB. Shows raw leads + distinct project_name
// values so you know exactly what to create in project_details.
exports.previewHousingLeads = async (req, res) => {
  try {
    const { start_date, end_date, flat_ids } = req.query;
    const result = await previewHousingProjectNames({
      start_date: start_date ? Number(start_date) : undefined,
      end_date: end_date ? Number(end_date) : undefined,
      flat_ids,
    });
    return res
      .status(200)
      .json(apiResponse(200, false, true, [result], "Housing.com preview fetched"));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message || "Housing.com preview failed"));
  }
};

// GET /api/v1/housing-leads-sync?start_date=&end_date=
// start_date / end_date are optional epoch seconds; defaults to last 24h.
exports.triggerHousingLeadsSync = async (req, res) => {
  try {
    const { start_date, end_date, flat_ids } = req.query;
    const summary = await syncHousingLeads({
      start_date: start_date ? Number(start_date) : undefined,
      end_date: end_date ? Number(end_date) : undefined,
      flat_ids,
    });
    return res
      .status(200)
      .json(apiResponse(200, false, true, [summary], "Housing.com sync completed"));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message || "Housing.com sync failed"));
  }
};
