"user-strict";
const moment = require("moment");
const { getSocketIO } = require("../../config/io.config");
const sequelize = require("../../config/seq.config");
const { apiResponse } = require("../../helper/helperResponse");

const {
  queryDb,
  randomStrAlphabetNumeric,
  randomStrNumeric,
  deCryptData,
  enCryptData,
} = require("../../helper/utilityHelper");
const { dgs, sww, sr, dus, dss, pas, ndf, etr } = require("../../msgHelper");
const { ActivityLogsFuns } = require("../../utils/ActivityLogs");
const { ensureUpload, deleteOldFile } = require("../../utils/HandleFiles");
const { leadValidationSchema } = require("../../utils/Validation");

exports.statusList = async (req, res) => {
  try {
    const q =
      "select `ld_bkt_status`,`ld_bkt_st_slug`,`ld_bkt_desc`,`ld_bkt_is_active` FROM `lead_bucket_status`;";
    const data = await queryDb(q, []);
    if (data?.length === 0)
      return res.status(201).json(apiResponse(201, false, false, [], ndf));
    return res.status(200).json(apiResponse(200, false, true, data, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.empLogin = async (req, res) => {
  try {
    const { username, password, lgn_fcm_token = "" } = req.body;
    const q =
      "SELECT `lgn_id`, `emp_name`, `emp_unique_id` FROM `emp_login` INNER JOIN `emp_registration_details` ON emp_lgn_id = lgn_id WHERE (`lgn_email` = ? OR `lgn_mob` = ?) AND `lgn_pass` = ? LIMIT 1;";
    const data = await queryDb(q, [username, username, password]);
    if (data?.length === 0)
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            false,
            false,
            [],
            "Credential not found in our record"
          )
        );
    const token = randomStrAlphabetNumeric(100);
    await queryDb(
      "UPDATE `emp_login` SET `lgn_token` = ?,lgn_fcm_token = ? WHERE lgn_id = ?;",
      [token, lgn_fcm_token, data?.[0]?.lgn_id]
    );
    await ActivityLogsFuns(
      data?.[0]?.lgn_id,
      1,
      5,
      "Login Successfully",
      "Login Successfully"
    );
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        [
          {
            token,
            emp_name: data?.[0]?.emp_name,
            emp_unique_id: data?.[0]?.emp_unique_id,
          },
        ],
        "Login Successfully"
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};

exports.claimLeadByEmp = async (req, res) => {
  const userId = req.userId;
  const socketId = req?.headers?.socketid || req?.headers?.socketId || null;
  const { lead_id } = req.query;
  if (!lead_id)
    return res.status(201).json(apiResponse(201, true, false, [], etr));
  const t = await sequelize.transaction();

  try {
    const isAlreadyClaimed = await queryDb(
      "SELECT clm_id FROM claimed_interested_leads WHERE `clm_lead_id` = ? LIMIT 1;",
      [Number(lead_id)]
    );
    if (isAlreadyClaimed?.length > 0) {
      await t.rollback();
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "Already Claimed!"));
    }
    await queryDb(
      "insert into `claimed_interested_leads`(`clm_lead_id`,`clm_emp_id`) values(?,?);",
      [Number(lead_id), Number(userId)]
    );
    const leadInfo = await queryDb(
      "SELECT lead_id,lead_mob_no,lead_alter_mob_no,lead_email,lead_sort_des FROM lead_basic_details WHERE `lead_id` = ? LIMIT 1;",
      [Number(lead_id)]
    );
    await queryDb(
      "INSERT INTO `lead_extended_info`(`ex_lead_id`,`ex_emp_id`,`ex_mobile`,`ex_alternate_mob`,`ex_email`,`ex_additional_info`,ex_project_id) VALUES(?,?,?,?,?,?,?);",
      [
        Number(lead_id),
        Number(userId),
        leadInfo?.[0]?.lead_mob_no || "",
        leadInfo?.[0]?.lead_alter_mob_no || "",
        leadInfo?.[0]?.lead_email || "",
        leadInfo?.[0]?.lead_sort_des || "",
        leadInfo?.[0]?.lead_project_id || 0,
      ]
    );
    await ActivityLogsFuns(
      Number(userId),
      lead_id,
      4,
      "Claimed Lead",
      "Change Status to Claimed"
    );
    if (socketId) {
      const io = getSocketIO();
      io.sockets.sockets.get(socketId)?.broadcast.emit("claimed", lead_id);
    }

    await t.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dus));
  } catch (e) {
    t.rollback();
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};

exports.basicClaimedLeadList = async (req, res) => {
  const userId = req.userId;
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
      lead_type = "ALL", // 1: New, 2: Cold, 3: Warm, 4: Close, 5: Convert, 6: Hot
      followup_type = "ALL", // Calling, BOP Done, Site Visit Done, Office Meeting Done, Home BOP Done
    } = req.body;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `SELECT COUNT(*) AS cnt FROM lead_basic_details
          LEFT JOIN lead_contact_method ON lead_contact_meth = ld_cont_id
          LEFT JOIN lead_source ON ld_src_id = lead_source
          LEFT JOIN lead_bucket_status ON ld_bkt_id = lead_bkt_status
          LEFT JOIN claimed_interested_leads ON clm_lead_id = lead_id
          LEFT JOIN lead_extended_info ON ex_lead_id = lead_id
          WHERE clm_emp_id = ? `;
    let baseQuery = `SELECT ex_lead_ratting_int,lead_cust_name,lead_id,lead_unique_id,lead_title,lead_sort_des,lead_mob_no,lead_alter_mob_no,lead_email,
          lead_created_at,ld_cont_name,ld_src_name,ld_bkt_status,ld_bkt_st_slug,clm_created_at,
          (SELECT sch_time FROM schedule_job WHERE emp_id = ? AND 
          schedule_job.lead_id = lead_basic_details.lead_id ORDER BY sch_id DESC LIMIT 1) AS sch_date,
          (SELECT schedule_for FROM schedule_job WHERE emp_id = ? 
          AND schedule_job.lead_id = lead_basic_details.lead_id ORDER
           BY sch_id DESC LIMIT 1) AS sch_for,
          (SELECT trf_id FROM lead_transferred_details WHERE 
          trf_lead_id = lead_id AND trf_from_id = ? LIMIT 1) AS is_transferred,
          (SELECT trf_id FROM lead_transferred_details WHERE 
          trf_lead_id = lead_id AND trf_to_id = ? LIMIT 1) AS is_received,
          JSON_OBJECT(
            'pro_id',pro_id,
            'pro_unique_id',pro_unique_id,
            'pro_title',pro_title,
            'pro_sort_description',pro_sort_description,
            'pro_full_description',pro_full_description,
            'pro_image',pro_image,
            'created_at',created_at
          ) AS project_details
          FROM lead_basic_details
          LEFT JOIN lead_contact_method ON lead_contact_meth = ld_cont_id
          LEFT JOIN lead_source ON ld_src_id = lead_source
          LEFT JOIN lead_bucket_status ON ld_bkt_id = lead_bkt_status
          LEFT JOIN claimed_interested_leads ON clm_lead_id = lead_id
          LEFT JOIN lead_extended_info ON ex_lead_id = lead_id
          LEFT JOIN project_details ON pro_id = lead_project_id
          WHERE clm_emp_id = ? `;
    let reP = [Number(userId)];
    let reB = [Number(userId), Number(userId), Number(userId),Number(userId),Number(userId)];
    if (start_date && end_date) {
      countQuery +=
        "AND  DATE(clm_created_at) >= ? AND DATE(clm_created_at) <= ? ";
      baseQuery +=
        " AND DATE(clm_created_at) >= ? AND DATE(clm_created_at) <= ? ";
      reP.push(
        moment(start_date)?.format("YYYY-MM-DD"),
        moment(end_date)?.format("YYYY-MM-DD")
      );
      reB.push(
        moment(start_date)?.format("YYYY-MM-DD"),
        moment(end_date)?.format("YYYY-MM-DD")
      );
    }
    if (search) {
      countQuery +=
        " AND (lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_title LIKE ? OR lead_sort_des LIKE ? OR lead_mob_no LIKE ? OR lead_alter_mob_no LIKE ? OR lead_email LIKE ? OR ld_cont_name LIKE ? OR ld_src_name LIKE ?) ";
      baseQuery +=
        " AND (lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_title LIKE ? OR lead_sort_des LIKE ? OR lead_mob_no LIKE ? OR lead_alter_mob_no LIKE ? OR lead_email LIKE ? OR ld_cont_name LIKE ? OR ld_src_name LIKE ?) ";
      reP.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
      reB.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }
    if (lead_type != "ALL" && !Number.isNaN(Number(lead_type))) {
      baseQuery += " AND lead_bkt_status = ? ";
      countQuery += " AND lead_bkt_status = ? ";
      reB.push(Number(lead_type));
      reP.push(Number(lead_type));
    }
    if (followup_type && followup_type !== "ALL") {
      baseQuery += ` AND lead_id IN (SELECT lf.follow_lead_id FROM lead_followups lf INNER JOIN (SELECT follow_lead_id, MAX(follow_id) AS max_id FROM lead_followups GROUP BY follow_lead_id) latest ON latest.max_id = lf.follow_id WHERE lf.follow_type = ?) `;
      countQuery += ` AND lead_id IN (SELECT lf.follow_lead_id FROM lead_followups lf INNER JOIN (SELECT follow_lead_id, MAX(follow_id) AS max_id FROM lead_followups GROUP BY follow_lead_id) latest ON latest.max_id = lf.follow_id WHERE lf.follow_type = ?) `;
      reB.push(followup_type);
      reP.push(followup_type);
    }

    baseQuery += " ORDER BY `lead_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);

    // Latest structured follow-up per lead, scoped to just this page's leads —
    // same pattern as the admin basicLeadList/leadReportList enrichment.
    const leadIds = result.map((r) => r.lead_id);
    let latestFollowupByLeadId = {};
    let followupCountByLeadId = {};
    if (leadIds.length > 0) {
      const idPlaceholders = leadIds.map(() => "?").join(",");
      const [latestFollowupRows, followupRows] = await Promise.all([
        queryDb(
          `SELECT lf.follow_lead_id, lf.follow_type, lf.follow_remark,
                  lf.follow_calling_done, lf.follow_next_appointment_date, lf.follow_created_at
           FROM lead_followups lf
           INNER JOIN (
             SELECT follow_lead_id, MAX(follow_id) AS max_id
             FROM lead_followups
             WHERE follow_lead_id IN (${idPlaceholders})
             GROUP BY follow_lead_id
           ) latest ON latest.max_id = lf.follow_id;`,
          leadIds
        ),
        queryDb(
          `SELECT follow_lead_id, COUNT(*) AS cnt FROM lead_followups WHERE follow_lead_id IN (${idPlaceholders}) GROUP BY follow_lead_id;`,
          leadIds
        ),
      ]);
      latestFollowupByLeadId = latestFollowupRows.reduce((acc, row) => {
        acc[row.follow_lead_id] = row;
        return acc;
      }, {});
      followupCountByLeadId = followupRows.reduce((acc, row) => {
        acc[row.follow_lead_id] = row.cnt;
        return acc;
      }, {});
    }
    const resultWithFollowup = result.map((row) => {
      const latestFollowup = latestFollowupByLeadId[row.lead_id];
      return {
        ...row,
        followup_count: Number(followupCountByLeadId[row.lead_id]) || 0,
        last_followup_type: latestFollowup?.follow_type || null,
        last_followup_remark: latestFollowup?.follow_remark || null,
        last_followup_calling_done:
          latestFollowup?.follow_calling_done ?? null,
        last_followup_next_appointment_date:
          latestFollowup?.follow_next_appointment_date || null,
        last_followup_at: latestFollowup?.follow_created_at || null,
      };
    });

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: resultWithFollowup,
          totalRows,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        dgs
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};
// Counts for the follow-up-type filter row on the employee "My Leads" page —
// scoped to this employee's own claimed leads only. Mirrors the admin
// getFollowupTypeBucketCount but filtered by clm_emp_id instead of "any
// assigned lead".
exports.getFollowupTypeBucketCountEmp = async (req, res) => {
  const userId = req.userId;
  try {
    const bucketResult = await queryDb(
      `SELECT lf.follow_type, COUNT(*) AS cnt
       FROM lead_basic_details lb
       INNER JOIN lead_followups lf ON lf.follow_id = (
         SELECT MAX(follow_id) FROM lead_followups WHERE follow_lead_id = lb.lead_id
       )
       INNER JOIN claimed_interested_leads ON claimed_interested_leads.clm_lead_id = lb.lead_id
       WHERE claimed_interested_leads.clm_emp_id = ?
       GROUP BY lf.follow_type;`,
      [Number(userId)]
    );
    return res
      .status(200)
      .json(
        apiResponse(200, false, true, bucketResult, "Counts fetched successfully")
      );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

// Powers the dynamic per-follow-up-type sidebar menus on the employee side.
// Matches any lead (among this employee's own claimed leads) that has EVER
// had a follow-up of the given type — not just the latest one — mirroring
// the admin leadsByFollowupType but scoped to clm_emp_id.
exports.leadsByFollowupTypeEmp = async (req, res) => {
  const userId = req.userId;
  try {
    const {
      search = "",
      followup_type = "",
      follow_status = "",
      next_appointment_only = false,
      page = 1,
      count = 10,
    } = req.body;
    if (!followup_type && !follow_status && !next_appointment_only) {
      return res
        .status(400)
        .json(
          apiResponse(
            true,
            false,
            [],
            "followup_type, follow_status or next_appointment_only is required"
          )
        );
    }
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    // The 3 filter modes are mutually exclusive: an explicit next-appointment
    // date, a permanent Status label, or the legacy per-type bucket.
    let matchClause, matchParams;
    if (next_appointment_only) {
      matchClause = "follow_next_appointment_date IS NOT NULL";
      matchParams = [];
    } else if (follow_status) {
      matchClause = "follow_status = ?";
      matchParams = [follow_status];
    } else {
      matchClause = "follow_type = ?";
      matchParams = [followup_type];
    }

    let countQuery = `SELECT COUNT(*) AS cnt FROM lead_basic_details
          LEFT JOIN lead_contact_method ON lead_contact_meth = ld_cont_id
          LEFT JOIN lead_source ON ld_src_id = lead_source
          LEFT JOIN lead_bucket_status ON ld_bkt_id = lead_bkt_status
          LEFT JOIN claimed_interested_leads ON clm_lead_id = lead_id
          LEFT JOIN lead_extended_info ON ex_lead_id = lead_id
          WHERE clm_emp_id = ?
          AND lead_id IN (SELECT DISTINCT follow_lead_id FROM lead_followups WHERE ${matchClause}) `;
    let baseQuery = `SELECT ex_lead_ratting_int,lead_cust_name,lead_id,lead_unique_id,lead_title,lead_sort_des,lead_mob_no,lead_alter_mob_no,lead_email,
          lead_created_at,ld_cont_name,ld_src_name,ld_bkt_status,ld_bkt_st_slug,clm_created_at,
          JSON_OBJECT(
            'pro_id',pro_id,
            'pro_unique_id',pro_unique_id,
            'pro_title',pro_title,
            'pro_sort_description',pro_sort_description,
            'pro_full_description',pro_full_description,
            'pro_image',pro_image,
            'created_at',created_at
          ) AS project_details
          FROM lead_basic_details
          LEFT JOIN lead_contact_method ON lead_contact_meth = ld_cont_id
          LEFT JOIN lead_source ON ld_src_id = lead_source
          LEFT JOIN lead_bucket_status ON ld_bkt_id = lead_bkt_status
          LEFT JOIN claimed_interested_leads ON clm_lead_id = lead_id
          LEFT JOIN lead_extended_info ON ex_lead_id = lead_id
          LEFT JOIN project_details ON pro_id = lead_project_id
          WHERE clm_emp_id = ?
          AND lead_id IN (SELECT DISTINCT follow_lead_id FROM lead_followups WHERE ${matchClause}) `;
    let reP = [Number(userId), ...matchParams];
    let reB = [Number(userId), ...matchParams];
    if (search) {
      countQuery +=
        " AND (lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_title LIKE ? OR lead_sort_des LIKE ? OR lead_mob_no LIKE ? OR lead_alter_mob_no LIKE ? OR lead_email LIKE ? OR ld_cont_name LIKE ? OR ld_src_name LIKE ?) ";
      baseQuery +=
        " AND (lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_title LIKE ? OR lead_sort_des LIKE ? OR lead_mob_no LIKE ? OR lead_alter_mob_no LIKE ? OR lead_email LIKE ? OR ld_cont_name LIKE ? OR ld_src_name LIKE ?) ";
      reP.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
      reB.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    baseQuery += " ORDER BY `lead_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);

    const leadIds = result.map((r) => r.lead_id);
    let latestFollowupByLeadId = {};
    // Latest entry OF THIS SPECIFIC TYPE per lead (the lead's overall latest
    // follow-up may already be a later type) — lets the page show that
    // follow-up's own remark/time/visit-details.
    let typeFollowupByLeadId = {};
    if (leadIds.length > 0) {
      const idPlaceholders = leadIds.map(() => "?").join(",");
      const [latestFollowupRows, typeFollowupRows] = await Promise.all([
        queryDb(
          `SELECT lf.follow_lead_id, lf.follow_type, lf.follow_remark,
                  lf.follow_calling_done, lf.follow_next_appointment_date, lf.follow_created_at
           FROM lead_followups lf
           INNER JOIN (
             SELECT follow_lead_id, MAX(follow_id) AS max_id
             FROM lead_followups
             WHERE follow_lead_id IN (${idPlaceholders})
             GROUP BY follow_lead_id
           ) latest ON latest.max_id = lf.follow_id;`,
          leadIds
        ),
        queryDb(
          `SELECT lf.follow_lead_id, lf.follow_remark, lf.follow_calling_done,
                  lf.follow_next_appointment_date, lf.follow_location,
                  lf.follow_meeting_mode, lf.follow_duration, lf.follow_created_at
           FROM lead_followups lf
           INNER JOIN (
             SELECT follow_lead_id, MAX(follow_id) AS max_id
             FROM lead_followups
             WHERE follow_lead_id IN (${idPlaceholders}) AND ${matchClause}
             GROUP BY follow_lead_id
           ) latest ON latest.max_id = lf.follow_id;`,
          [...leadIds, ...matchParams]
        ),
      ]);
      latestFollowupByLeadId = latestFollowupRows.reduce((acc, row) => {
        acc[row.follow_lead_id] = row;
        return acc;
      }, {});
      typeFollowupByLeadId = typeFollowupRows.reduce((acc, row) => {
        acc[row.follow_lead_id] = row;
        return acc;
      }, {});
    }
    const resultWithFollowup = result.map((row) => {
      const latestFollowup = latestFollowupByLeadId[row.lead_id];
      const typeFollowup = typeFollowupByLeadId[row.lead_id];
      return {
        ...row,
        last_followup_type: latestFollowup?.follow_type || null,
        last_followup_remark: latestFollowup?.follow_remark || null,
        last_followup_calling_done:
          latestFollowup?.follow_calling_done ?? null,
        last_followup_next_appointment_date:
          latestFollowup?.follow_next_appointment_date || null,
        last_followup_at: latestFollowup?.follow_created_at || null,
        type_followup_remark: typeFollowup?.follow_remark || null,
        type_followup_calling_done: typeFollowup?.follow_calling_done ?? null,
        type_followup_next_appointment_date:
          typeFollowup?.follow_next_appointment_date || null,
        type_followup_location: typeFollowup?.follow_location || null,
        type_followup_meeting_mode: typeFollowup?.follow_meeting_mode || null,
        type_followup_duration: typeFollowup?.follow_duration || null,
        type_followup_at: typeFollowup?.follow_created_at || null,
      };
    });

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: resultWithFollowup,
          totalRows,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        dgs
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

// Powers the "Lead flow, last 8 weeks" chart on the Employee Dashboard.
// Bucketed by clm_created_at (when the lead was CLAIMED/assigned to this
// employee) rather than lead_created_at (when the lead record was first
// created in the system) — leads are frequently bulk-imported long before
// they're ever assigned, so lead_created_at is often years old and would
// leave this chart flat at 0 even for an employee actively getting new
// leads. clm_created_at reflects when the lead actually entered this
// employee's pipeline, which is what "new leads captured" means here.
// "Converted" = currently in Convert status (bkt id 5) among that week's
// claims — there's no separate "converted_at" timestamp tracked, so this is
// the closest honest approximation available from the schema.
exports.getWeeklyLeadTrendEmp = async (req, res) => {
  const userId = req.userId;
  try {
    const rows = await queryDb(
      `SELECT
         YEARWEEK(clm_created_at, 1) AS yw,
         MIN(DATE(clm_created_at)) AS week_start,
         COUNT(*) AS leads_cnt,
         SUM(CASE WHEN lead_bkt_status = 5 THEN 1 ELSE 0 END) AS converted_cnt
       FROM claimed_interested_leads
       INNER JOIN lead_basic_details ON lead_id = clm_lead_id
       WHERE clm_emp_id = ?
         AND clm_created_at >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
       GROUP BY yw
       ORDER BY yw ASC;`,
      [Number(userId)]
    );
    return res.status(200).json(apiResponse(200, false, true, rows, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

// Powers the "Where leads come from" chart on the Employee Dashboard — count
// of this employee's claimed leads by source, current calendar month.
exports.getLeadSourceBreakdownEmp = async (req, res) => {
  const userId = req.userId;
  try {
    const rows = await queryDb(
      `SELECT ld_src_name, COUNT(*) AS cnt
       FROM lead_basic_details
       LEFT JOIN lead_source ON ld_src_id = lead_source
       INNER JOIN claimed_interested_leads ON clm_lead_id = lead_id
       WHERE clm_emp_id = ?
         AND MONTH(lead_created_at) = MONTH(CURDATE())
         AND YEAR(lead_created_at) = YEAR(CURDATE())
       GROUP BY ld_src_name
       ORDER BY cnt DESC
       LIMIT 5;`,
      [Number(userId)]
    );
    return res.status(200).json(apiResponse(200, false, true, rows, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

// Employee-side "Create Lead" — same fields as the admin Create Lead form,
// but always self-claims the new lead to the creating employee (claimed_
// interested_leads is the single source of truth for ownership), so it shows
// up immediately in that employee's own "My Leads" list.
exports.createLeadByEmp = async (req, res) => {
  const userId = req.userId;
  const body = req.body;
  const { error } = leadValidationSchema.validate(body);
  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    return res.status(201).json(apiResponse(201, false, false, [], message));
  }

  const {
    lead_cust_name,
    lead_sort_des = "",
    lead_mob_no,
    lead_alter_mob_no = "",
    lead_email = "",
    lead_source,
    lead_project_id,
    lead_business = "",
    lead_gender = "",
    lead_city = "",
    lead_state = "",
    lead_country = "",
    lead_bkt_status = "", // 1: New, 2: Cold, 3: Warm, 4: Close, 5: Convert, 6: Hot
  } = req.body;
  if (!lead_mob_no || !lead_source || !lead_project_id) {
    return res.status(201).json(apiResponse(201, true, false, [], etr));
  }
  const t = await sequelize.transaction();
  try {
    const projectName = await queryDb(
      "SELECT `pro_title` FROM `project_details` WHERE `pro_id` = ? LIMIT 1;",
      [Number(lead_project_id)]
    );
    const lead_title = projectName?.[0]?.pro_title || "Testing";
    const randomId = "LEAD" + randomStrNumeric(10);
    // Lead type at creation is optional — New/Cold/Warm/Hot/Close/Convert are
    // all valid choices from the create-lead form; default to New (1) when unset.
    const validBktStatuses = [1, 2, 3, 4, 5, 6];
    const leadBktStatus = validBktStatuses.includes(Number(lead_bkt_status))
      ? Number(lead_bkt_status)
      : 1;
    const q =
      "INSERT INTO `lead_basic_details`(`lead_unique_id`,lead_cust_name,lead_project_id,lead_insert_emp_id,`lead_inserted_by`,`lead_title`,`lead_sort_des`,`lead_mob_no`,`lead_alter_mob_no`,`lead_email`,`lead_business`,`lead_gender`,`lead_city`,`lead_state`,`lead_country`,`lead_source`,`lead_bkt_status`) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
    await queryDb(q, [
      randomId,
      lead_cust_name,
      Number(lead_project_id),
      Number(userId),
      "Emp",
      lead_title,
      lead_sort_des,
      lead_mob_no,
      lead_alter_mob_no,
      lead_email,
      lead_business,
      lead_gender,
      lead_city,
      lead_state,
      lead_country,
      lead_source,
      leadBktStatus,
    ]);
    const last_id = await queryDb("SELECT LAST_INSERT_ID() AS last_id", []);
    // Self-claim — the lead an employee creates belongs to them right away.
    await queryDb(
      "INSERT INTO `claimed_interested_leads`(`clm_lead_id`,`clm_emp_id`,`clm_curr_status`) VALUES(?,?,?);",
      [Number(last_id?.[0]?.last_id), Number(userId), 1]
    );
    (await t)?.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    await t?.rollback();
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
// 🧠 Upload helper

exports.addUpdateBookingInfo = async (req, res) => {
  const userId = req.userId;
  try {
    const { booking_lead_id } = JSON.parse(req.body.data || "");
    if (!booking_lead_id || !userId)
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            false,
            false,
            [],
            "booking_lead_id and user_id are required"
          )
        );
    req.body = JSON.parse(req.body.data || "");
    const booking_co_applicant = req?.body.booking_co_applicant || [];

    const existing = await queryDb(
      "SELECT * FROM booking_details WHERE booking_lead_id = ? AND booking_emp_id = ? LIMIT 1",
      [Number(booking_lead_id), Number(userId)]
    );

    //  Delete old files if they exist
    if (existing?.length > 0) {
      const old = existing[0];
      [
        "booking_doc1_img",
        "booking_doc2_img",
        "booking_doc3_img",
        "booking_form",
        "booking_cancel_cheque",
        "booking_deal_fee_form",
        "booking_sales_confirmation",
      ].forEach((key) => {
        if (req.files?.[key]) deleteOldFile(old?.[key]);
      });
    }
    const doc1 = ensureUpload(req?.files?.booking_doc1_img, "emp_docs");
    const doc2 = ensureUpload(req?.files?.booking_doc2_img, "emp_docs");
    const doc3 = ensureUpload(req?.files?.booking_doc3_img, "emp_docs");

    const booking_form = ensureUpload(req?.files?.booking_form, "emp_docs");
    const booking_cancel_cheque = ensureUpload(
      req?.files?.booking_cancel_cheque,
      "emp_docs"
    );
    const booking_deal_fee_form = ensureUpload(
      req?.files?.booking_deal_fee_form,
      "emp_docs"
    );
    const booking_sales_confirmation = ensureUpload(
      req?.files?.booking_sales_confirmation,
      "emp_docs"
    );

    const fields = {
      ...req?.body,
      booking_emp_id: userId,
      ...(doc1 && { booking_doc1_img: doc1 }),
      ...(doc2 && { booking_doc2_img: doc2 }),
      ...(doc3 && { booking_doc3_img: doc3 }),
      ...(booking_form && { booking_form }),
      ...(booking_cancel_cheque && { booking_cancel_cheque }),
      ...(booking_deal_fee_form && { booking_deal_fee_form }),
      ...(booking_sales_confirmation && { booking_sales_confirmation }),
      booking_created_at: new Date(),
      booking_co_applicant:
        existing?.length > 0
          ? existing?.[0]?.booking_co_applicant
          : JSON.stringify(booking_co_applicant),
    };

    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (existing?.length > 0) {
      const booking_id = existing[0]?.booking_id;
      const updates = keys.map((key) => `${key} = ?`).join(", ");
      await queryDb(
        `UPDATE booking_details SET ${updates} WHERE booking_id = ?`,
        [...values, booking_id]
      );
      await ActivityLogsFuns(
        Number(userId),
        Number(booking_lead_id),
        3,
        "Update Booking Details",
        "Update Booking Details"
      );
      return res.status(200).json(apiResponse(200, false, true, [], dus));
    } else {
      const placeholders = keys.map(() => "?").join(", ");
      await queryDb(
        `INSERT INTO booking_details (${keys.join(
          ", "
        )}) VALUES (${placeholders})`,
        values
      );
      await ActivityLogsFuns(
        Number(userId),
        Number(booking_lead_id),
        3,
        "Add Booking Details",
        "Add Booking Details"
      );
      return res.status(200).json(apiResponse(200, false, true, [], dss));
    }
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};

exports.bookingLeadList = async (req, res) => {
  const userId = req.userId;

  const { lead_id } = req.body;

  try {
    let q = `SELECT * FROM booking_lead_list `;
    let re = [];
    if (lead_id) {
      q += `
             WHERE 
          booking_lead_id
          = ? AND 
          booking_emp_id
          = ? ;`;
      re = [Number(lead_id), Number(userId)];
    }

    const result = await queryDb(q, re);
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        result?.map((i) => {
          return {
            ...i,
            booking_co_applicant: i?.booking_co_applicant
              ? JSON.parse(i?.booking_co_applicant)
              : "",
          };
        }) || [],
        dgs
      )
    );
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};
exports.updateMeetingDoneStatus = async (req, res) => {
  // const userId = req.userId;

  const { lead_id, status } = req.body; // status: YES if done , else NO

  try {
    await queryDb(
      "UPDATE `lead_basic_details` SET `lead_meeting_staus` = ? WHERE `lead_id` = ?;",
      [status || "NO", Number(lead_id)]
    );
    await ActivityLogsFuns(
      Number(userId),
      Number(booking_lead_id),
      4,
      "Meeting Done",
      "Meeting has Done"
    );
    return res.status(200).json(apiResponse(200, false, true, [], dus));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};
exports.getActivityLogs = async (req, res) => {
  const userId = req.userId;
  const { status_id } = req.body;
  if (!status_id || !userId)
    res
      .status(201)
      .json(apiResponse(201, false, false, [], "status_id is required"));
  try {
    const result = await queryDb(
      `SELECT * FROM  activity_logs WHERE log_for = ? AND log_emp_id = ? `,
      [Number(status_id), Number(userId)]
    );

    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};
exports.getFollowFaceSiteVisitList = async (req, res) => {
  const userId = req.userId;
  const { lead_id, follow_type = 1 } = req.body; // followtype:1 for follow up, 2 for face , 3 for site visit
  try {
    let q = "";
    if (follow_type == 1) {
      // follow up
      q += `
SELECT 
  l.*,
     JSON_ARRAYAGG(
     JSON_OBJECT(
      'fl_id', ful.fl_id,
      'fl_lead_id', ful.fl_lead_id,
      'fl_emp_id', ful.fl_emp_id,
      'fl_schedule_on', ful.fl_schedule_on,
      'fl_make_note', ful.fl_make_note,
      'fl_created_at', ful.fl_created_at
    )
  ) AS follow_up_data
FROM lead_basic_details AS l
INNER JOIN follow_up_leads AS ful ON fl_lead_id = lead_id
WHERE ful.fl_emp_id = ? 
      `;
      if (lead_id) q += `AND ful.fl_lead_id = ? `;
      q += " GROUP BY fl_lead_id ";
    } else if (follow_type == 2) {
      // face to face
      q += `
      SELECT 
  l.*,
   JSON_ARRAYAGG(
    JSON_OBJECT(
      'fac_id',f2f.fac_id,
      'fac_lead_id', f2f.fac_lead_id,
      'fac_emp_id', f2f.fac_emp_id,
      'fac_schdule_date', f2f.fac_schdule_date,
      'fac_meeting_mode', f2f.fac_meeting_mode,
      'fac_destination', f2f.fac_destination,
      'fac_duration', f2f.fac_duration,
      'fac_reminder', f2f.fac_reminder,
      'fac_add_note', f2f.fac_add_note,
      'fac_created_at', f2f.fac_created_at
    )
  ) AS face_to_face
FROM lead_basic_details AS l
INNER JOIN face_to_face AS f2f ON fac_lead_id = lead_id
WHERE  f2f.fac_emp_id = ? 
      `;
      if (lead_id) q += `AND f2f.fac_lead_id = ? `;
      q += " GROUP BY fac_lead_id ";
    } else {
      q += `
      SELECT 
  l.*,
  JSON_ARRAYAGG(
     JSON_OBJECT(
      'st_vst_id', sv.st_vst_id,
      'st_vst_lead_id', sv.st_vst_lead_id,
      'st_vst_emp_id', sv.st_vst_emp_id,
      'st_vst_schdule_date', sv.st_vst_schdule_date,
      'st_vst_meeting_mode', sv.st_vst_meeting_mode,
      'st_vst_duration', sv.st_vst_duration,
      'st_vst_reminder', sv.st_vst_reminder,
      'st_vst_add_note', sv.st_vst_add_note,
      'st_vst_location', sv.st_vst_location,
      'st_vst_created_at', sv.st_vst_created_at
    )
  ) AS site_visit
FROM lead_basic_details AS l
INNER JOIN site_visit AS sv ON st_vst_lead_id = lead_id
WHERE sv.st_vst_emp_id = ? 
      `;
      if (lead_id) q += `AND sv.st_vst_lead_id = ? `;
      q += " GROUP BY st_vst_lead_id ";
    }
    const result = await queryDb(
      q,
      lead_id ? [Number(userId), Number(lead_id)] : [Number(userId)]
    );
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};
exports.getDashboardData = async (req, res) => {
  const userId = req.userId;
  try {
    let q = `
    SELECT
      SUM(CASE WHEN lbd.lead_bkt_status = 1 THEN 1 ELSE 0 END) AS new_cnt,
      SUM(CASE WHEN lbd.lead_bkt_status = 2 THEN 1 ELSE 0 END) AS cold_cnt,
      SUM(CASE WHEN lbd.lead_bkt_status = 3 THEN 1 ELSE 0 END) AS warm_cnt,
      SUM(CASE WHEN lbd.lead_bkt_status = 4 THEN 1 ELSE 0 END) AS close_cnt,
      SUM(CASE WHEN lbd.lead_bkt_status = 5 THEN 1 ELSE 0 END) AS convert_cnt,
      SUM(CASE WHEN lbd.lead_bkt_status = 6 THEN 1 ELSE 0 END) AS hot_cnt,
      (
      SELECT COUNT(*) FROM schedule_job INNER JOIN lead_basic_details ON 
      lead_basic_details.lead_id = schedule_job.lead_id WHERE sch_time IS NOT
      NULL AND DATE(sch_time) > DATE(NOW()) AND emp_id = ? 
       AND lead_meeting_staus = 'NO'  
      ) AS out_dated_evnt_cnt,
       (0) AS ignored_cnt
    FROM claimed_interested_leads clm
    INNER JOIN lead_basic_details lbd ON lbd.lead_id = clm.clm_lead_id
    WHERE clm.clm_emp_id = ?;
      `;
    const result = await queryDb(q, [Number(userId), Number(userId)]);
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};
exports.getProjectPhaseDetailsForShareKit = async (req, res) => {
  const userId = req.userId;
  try {
    let q = `SELECT * FROM project_with_phase_details;`;
    const result = await queryDb(q, []);
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};
exports.getEmployeeList = async (req, res) => {
  try {

    const countQuery = "SELECT * FROM `emp_registration_details` ORDER BY `emp_id` DESC ";
    const result = await queryDb(countQuery);

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result
        },
        dgs
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};
