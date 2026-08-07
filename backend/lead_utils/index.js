"user-strict";
const sequelize = require("../config/seq.config");
const { apiResponse } = require("../helper/helperResponse");
const {
  queryDb,
  randomStrAlphabet,
  randomStrNumeric,
} = require("../helper/utilityHelper");
const { dgs, sr, sww, etr, dus, dss } = require("../msgHelper");
const moment = require("moment");
const { ActivityLogsFuns } = require("../utils/ActivityLogs");
const dateTimeValidation = require("../utils/DateTImeValidation");
const scheduleTask = require("../utils/ScheduleJob");
exports.durationAndReminderUtilityData = async (req, res) => {
  try {
    const durationData = await queryDb(
      "SELECT `utl_me_duration_title`,`utl_me_duration_time` FROM `utility_duration_reminder` WHERE `utl_me_duration_status` = 1 ;",
      []
    );
    const reminData = await queryDb(
      "SELECT `utl_me_remin_title`,`utl_me_remin_time` FROM `utility_duration_reminder` WHERE `utl_me_remin_status` = 1 ;",
      []
    );
    const followData = await queryDb(
      "SELECT `utl_me_foll_at_title`,`utl_me_foll_at_time` FROM `utility_duration_reminder` WHERE `utl_me_foll_at_status` = 1 ;",
      []
    );

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        [
          {
            duration: durationData,
            reminData: reminData,
            followAt: followData,
          },
        ],
        dgs
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.leadUpdateRelatedDropDowns = async (req, res) => {
  try {
    const property_type = await queryDb(
      "select * from `property_type` where `prop_status` = 1; ",
      []
    );
    const budgetData = await queryDb(
      "SELECT * FROM `budget_list` WHERE `bud_status` = 1; ",
      []
    );
    const followData = await queryDb(
      "SELECT `utl_me_foll_at_title`,`utl_me_foll_at_time` FROM `utility_duration_reminder` WHERE `utl_me_foll_at_status` = 1 ;",
      []
    );
    const transportData = await queryDb(
      "select * from `transport_mode` where `tr_md_status` = 1; ",
      []
    );
    const possessionData = await queryDb(
      "SELECT * FROM `possession_list` WHERE `poss_status` = 1; ",
      []
    );
    const paymentMode = await queryDb(
      "SELECT * FROM `payment_mode` WHERE `pay_md_staus` = 1; ",
      []
    );
    const project_drop_down = await queryDb(
      "SELECT `pro_id`,`pro_title`,`pro_unique_id`  FROM `project_details` WHERE pro_status = 1 ORDER BY `pro_id` DESC; ",
      []
    );
    const budgetDropdown = await queryDb(
      "SELECT `bud_id`,`bud_title`,`bud_slug` FROM `budget_list` WHERE `bud_status` = 1;",
      []
    );
    const propertyTypeInterest = await queryDb(
      "select `prop_id`,`prop_title`,`prop_slug` from `property_type` where `prop_status` = 1;",
      []
    );
    const leadSourceMethod = await queryDb(
      " SELECT `ld_src_id`,`ld_src_name` FROM `lead_source` WHERE `ld_src_status` = 1;",
      []
    );
    const contactMethod = await queryDb(
      " SELECT `ld_cont_id`,`ld_cont_name` FROM `lead_contact_method` WHERE `ld_cont_status` = 1;",
      []
    );
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        [
          {
            propertyType: property_type,
            budgetData: budgetData,
            followAt: followData,
            transportData: transportData,
            possessionData: possessionData,
            paymentMode: paymentMode,
            projectsDropDown: project_drop_down,
            budgetDropdown: budgetDropdown,
            propertyTypeInterest: propertyTypeInterest,
            leadSource: leadSourceMethod,
            contactMethod: contactMethod,
          },
        ],
        dgs
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.failureReasonDropDown = async (req, res) => {
  try {
    const failureReason = await queryDb(
      `SELECT 
  fail_id,
  fail_title,
  fail_slug,
  JSON_ARRAYAGG(
    JSON_OBJECT(
    'fl_s_id',fl_s_id,
      'fl_s_title', fl_s_title,
      'fl_s_slug', fl_s_slug,
      'fl_s_description', fl_s_description
    )
  ) AS sub_reasons
FROM 
  lead_failure_reasons_dropdown
INNER JOIN 
  lead_failure_sub_reasons_dropdown ON fail_id = fl_s_fail_id
GROUP BY 
  fail_id;`,
      []
    );
    const bookingConfigDropdown = await queryDb(
      "select * from `booking_conf_dropdown`;",
      []
    );
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        [
          {
            failureReason: failureReason,
            bookingConfigDropdown: bookingConfigDropdown,
          },
        ],
        dgs
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};

exports.failLeadHandler = async (req, res) => {
  // const array = [
  //   {
  //     main_reason_id: "Project",
  //     sub_reason_id: [
  //       "Interested in other project",
  //       "Interested in real estate/renting property",
  //       "BHK Mismatch",
  //     ],
  //   },
  //   {
  //     main_reason_id: "Finance",
  //     sub_reason_id: ["Budget Mismatch", "Home loan issue", "Finance issue"],
  //   },
  // ];
  // const reasons = JSON.stringify(array);
  const userId = req.userId;
  let { lead_id, comments, reasons = [] } = req.body;
  let t;
  try {
    if (!lead_id) {
      return res
        .status(201)
        .json(apiResponse(201, true, false, [], "Lead ID is required"));
    }

    t = await sequelize.transaction();
    const ifAlreadyExist = await queryDb(
      "SELECT `fal_id` FROM `failure_leads` WHERE `fal_lead_id` = ? AND `fal_emp_id` = ?;",
      [Number(lead_id), Number(userId)]
    );
    let q =
      "INSERT INTO `failure_leads`(`fal_lead_id`,`fal_emp_id`,`fal_reason`,fal_add_notes) VALUES(?,?,?,?);";
    let re = [];
    if (ifAlreadyExist.length > 0) {
      q =
        "UPDATE `failure_leads` SET `fal_reason` = ?, fal_add_notes = ? WHERE fal_id = ?";
      re.push(
        JSON.stringify(reasons),
        comments,
        Number(ifAlreadyExist?.[0]?.fal_id)
      );
    } else {
      re.push(
        Number(lead_id),
        Number(userId),
        JSON.stringify(reasons),
        comments || ""
      );
      if (comments) {
        await queryDb(
          "INSERT INTO `lead_notes`(`nt_emp_id`,`nt_lead_id`,nt_title,`nt_description`) VALUES(?,?,?,?);",
          [Number(userId), Number(lead_id), "Failure", comments || ""]
        );
      }
    }
    await queryDb(q, re);
    await queryDb(
      "UPDATE `lead_basic_details` SET lead_bkt_status = ? WHERE `lead_id` = ? LIMIT 1;",
      [4, Number(lead_id)]
    );
    await queryDb(
      "UPDATE `claimed_interested_leads` SET `clm_curr_status` = 'Close' WHERE `clm_lead_id` = ? AND `clm_emp_id` = ?;",
      [Number(lead_id), Number(userId)]
    );
    await ActivityLogsFuns(
      Number(userId),
      Number(lead_id),
      4,
      "Update Status to close",
      "Update Lead Status to close"
    );
    // Clean up or do post-insert logic here if needed
    await t?.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    await t?.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.getFailLeadList = async (req, res) => {
  const userId = req.userId;
  try {
    const q = `
    SELECT
  fal_id,
  fal_reason,
  fal_add_notes,
  fal_lead_status,
  JSON_OBJECT(
    'lead_id',lead_id,
    'lead_unique_id', lead_unique_id,
    'lead_cust_name', lead_cust_name,
    'lead_title', lead_title,
    'lead_sort_des', lead_sort_des,
    'lead_mob_no', lead_mob_no,
    'lead_alter_mob_no', lead_alter_mob_no,
    'lead_email', lead_email,
    'lead_contact_meth', lead_contact_meth,
    'lead_source', lead_source,
    'lead_bkt_status', lead_bkt_status
  ) AS lead_info
  FROM lead_basic_details
  INNER JOIN failure_leads 
    ON fal_lead_id = lead_id
  WHERE
    fal_emp_id = ?
    AND fal_lead_status = 'Failed' AND
    lead_bkt_status = 4
    AND fal_is_active = 1
   `; // bkt status 4 is for close (failed)
    const result = await queryDb(q, [Number(userId)]);
    const newResult = result?.map((i) => {
      return {
        ...i,
        fal_reason:
          i?.fal_reason &&
          JSON.parse(i?.fal_reason)?.map((j) => {
            return {
              ...j,
              sub_reason_id:
                j?.sub_reason_id &&
                j?.sub_reason_id?.map((k) => {
                  return {
                    fl_s_title: k,
                  };
                }),
            };
          }),
      };
    });
    return res.status(200).json(apiResponse(200, false, true, newResult, dss));
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.recoverFailLead = async (req, res) => {
  const userId = req.userId;
  const { lead_id } = req.body;
  if (!lead_id) {
    return res
      .status(201)
      .json(apiResponse(201, true, false, [], "Lead ID is required"));
  }
  let t;
  try {
    t = await sequelize.transaction();
    await queryDb(
      "UPDATE `failure_leads` SET `fal_is_active` = 2 ,`fal_lead_status` = 2 WHERE `fal_lead_id` = ? AND `fal_emp_id` = ? LIMIT 1;",
      [Number(lead_id), Number(userId)]
    );
    await queryDb(
      "UPDATE `lead_basic_details` SET `lead_bkt_status` = 1 WHERE `lead_id` = ?;",
      [Number(lead_id)]
    );
    await queryDb(
      "update `claimed_interested_leads` set `clm_curr_status` = 'New' WHERE `clm_lead_id` = ? and `clm_emp_id` = ?;",
      [Number(lead_id), Number(userId)]
    );
    await ActivityLogsFuns(
      Number(userId),
      Number(lead_id),
      4,
      "Recover Lead Status",
      "Lead Recovered: Goes to New From Close Status"
    );
    await t.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.moveToNextStatus = async (req, res) => {
  const userId = req.userId;
  const { lead_id, status_id } = req.body;
  if (!lead_id) {
    return res
      .status(201)
      .json(apiResponse(201, true, false, [], "Lead ID is required"));
  }
  if (!status_id) {
    return res
      .status(201)
      .json(apiResponse(201, true, false, [], "Status Id is required"));
  }
  let t;
  try {
    const isOwnLead = await queryDb(
      "SELECT `clm_id` FROM `claimed_interested_leads` WHERE `clm_lead_id` = ? AND `clm_emp_id` = ? LIMIT 1;",
      [Number(lead_id), Number(userId)]
    );
    if (isOwnLead.length === 0) {
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            false,
            false,
            [],
            "Oops!, This lead claimed by another employee."
          )
        );
    }

    t = await sequelize.transaction();

    await queryDb(
      "UPDATE `lead_basic_details` SET `lead_bkt_status` = ? WHERE `lead_id` = ?;",
      [Number(status_id), Number(lead_id)]
    );
    if (Number(status_id) === 4) {
      // means :: Close (failed)
      const ifAlreadyExist = await queryDb(
        "SELECT `fal_id` FROM `failure_leads` WHERE `fal_lead_id` = ? AND `fal_emp_id` = ?;",
        [Number(lead_id), Number(userId)]
      );
      let q =
        "INSERT INTO `failure_leads`(`fal_lead_id`,`fal_emp_id`,`fal_reason`,fal_add_notes) VALUES(?,?,?,?);";
      let re = [];
      if (ifAlreadyExist.length > 0) {
        q =
          "UPDATE `failure_leads` SET `fal_reason` = ?, fal_add_notes = ? WHERE fal_id = ?";
        re.push(JSON.stringify([]), "", Number(ifAlreadyExist?.[0]?.fal_id));
      } else {
        re.push(Number(lead_id), Number(userId), JSON.stringify([]), "" || "");
      }
      await queryDb(q, re);
      await queryDb(
        "UPDATE `lead_basic_details` SET lead_bkt_status = ? WHERE `lead_id` = ? LIMIT 1;",
        [4, Number(lead_id)]
      );
      await queryDb(
        "UPDATE `claimed_interested_leads` SET `clm_curr_status` = 'Close' WHERE `clm_lead_id` = ? AND `clm_emp_id` = ?;",
        [Number(lead_id), Number(userId)]
      );
    }
    const getTitle = await queryDb(
      "SELECT `ld_bkt_status` FROM `lead_bucket_status` WHERE `ld_bkt_id` = ? LIMIT 1;",
      [Number(status_id)]
    );
    await ActivityLogsFuns(
      Number(userId),
      Number(lead_id),
      4,
      "Lead Status Change To " + getTitle?.[0]?.ld_bkt_status,
      "Lead Status Change To " + getTitle?.[0]?.ld_bkt_status
    );
    await t.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dus));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.getScheduledLeads = async (req, res) => {
  const { start_date, end_date } = req.body;
  const userId = req.userId;
  try {
    let q = `
  SELECT
  DATE(sch_time) AS sch_time,
  JSON_ARRAYAGG(
    JSON_OBJECT( 
      'sch_id', schedule_job.sch_id,
      'emp_id', schedule_job.emp_id,
      'schedule_for', schedule_job.schedule_for,
      'sch_time', schedule_job.sch_time,
      'isProcessed', schedule_job.isProcessed,
      'mode', schedule_job.mode,
      'navigate_to', schedule_job.navigate_to,
      'created_at', schedule_job.created_at,
      'lead_details', JSON_OBJECT(
        'lead_id', lead_basic_details.lead_id,
        'lead_unique_id', lead_basic_details.lead_unique_id,
        'lead_cust_name', lead_basic_details.lead_cust_name,
        'lead_title', lead_basic_details.lead_title,
        'lead_sort_des', lead_basic_details.lead_sort_des,
        'lead_mob_no', lead_basic_details.lead_mob_no,
        'lead_alter_mob_no', lead_basic_details.lead_alter_mob_no,
        'lead_email', lead_basic_details.lead_email,
        'lead_contact_meth', lead_basic_details.lead_contact_meth,
        'lead_source', lead_basic_details.lead_source,
        'lead_bkt_status', lead_basic_details.lead_bkt_status,
        'lead_created_at', lead_basic_details.lead_created_at
      )
    )
  ) AS schedule_summery
    FROM schedule_job
    LEFT JOIN lead_basic_details ON lead_basic_details.lead_id = schedule_job.lead_id
    WHERE schedule_job.emp_id = ?
    

    `;

    const params = [Number(userId)];
    if (start_date && end_date) {
      q += ` AND DATE(schedule_job.sch_time) BETWEEN ? AND ? `;
      params.push(
        moment(start_date).format("YYYY-MM-DD"),
        moment(end_date).format("YYYY-MM-DD"),
        Number(userId)
      );
    }

    q += ` GROUP BY DATE(sch_time)`;

    const result = await queryDb(q, params);

    return res
      .status(200)
      .json(apiResponse(200, false, true, result, "Success"));
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.getPhaseByProjectId = async (req, res) => {
  const { project_id } = req.query;
  if (!project_id)
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "project_id is required."));
  try {
    let q = `SELECT phase_id,phase_project_id,phase_title,phase_description FROM phase_details WHERE phase_status =  1 AND phase_project_id = ? ORDER BY phase_id DESC;`;

    const params = [Number(project_id)];
    const result = await queryDb(q, params);
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.addChannelPartner = async (req, res) => {
  const userId = req.userId;
  const {
    cp_name,
    cp_mobile_no,
    cp_email,
    cp_operation_localities,
    cp_firm_name,
  } = req.body;

  if (!cp_mobile_no || !cp_name)
    return res
      .status(201)
      .json(
        apiResponse(201, false, false, [], "Mobile no and name is required.")
      );
  const cp_unique_id = "CP" + randomStrAlphabet(10);

  try {
    const checkQuery = `SELECT * FROM channel_partner WHERE cp_mobile_no = ? LIMIT 1`;
    const existing = await queryDb(checkQuery, [cp_mobile_no]);

    if (existing.length > 0) {
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "Mobile No Already Exist"));
    } else {
      // Record doesn't exist - insert new one
      const insertQuery = `
        INSERT INTO channel_partner (
          cp_unique_id, cp_emp_id, cp_name, cp_mobile_no, cp_email,
          cp_operation_localities, cp_firm_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        cp_unique_id,
        Number(userId),
        cp_name || null,
        cp_mobile_no || null,
        cp_email || null,
        cp_operation_localities || null,
        cp_firm_name || null,
      ];

      await queryDb(insertQuery, insertParams);

      return res.status(200).json(apiResponse(200, false, true, [], dss));
    }
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.getChannelPartnerList = async (req, res) => {
  const userId = req.userId;
  const { search = "" } = req.body;

  try {
    let re = [];
    let q =
      "SELECT cp_id,`cp_unique_id`,`cp_name`,`cp_mobile_no`,`cp_email`,`cp_operation_localities`,`cp_firm_name`,`cp_created_at` FROM `channel_partner` WHERE `cp_emp_id` = ? ";
    re.push(Number(userId));
    if (search) {
      q +=
        "AND (cp_unique_id LIKE ? OR cp_name LIKE ? OR cp_mobile_no LIKE ? OR cp_email LIKE ? OR cp_operation_localities LIKE ? OR cp_firm_name LIKE ?)";
      re.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }
    q += "ORDER BY cp_id DESC";
    const result = await queryDb(q, re);

    return res.status(201).json(apiResponse(201, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.createSelfLead = async (req, res) => {
  const userId = req.userId;
  const {
    lead_cp_id,
    lead_cust_name = "",
    lead_mob_no,
    lead_alter_mob_no = "",
    lead_email = "",
    lead_contact_meth,
    lead_project_id,
    lead_phase_id,
    ex_interested_property_type_id,
    ex_lead_budget_id,
  } = req.body;
  let t;
  try {
    if (!ex_lead_budget_id)
      return res
        .status(201)
        .json(
          apiResponse(201, false, false, [], "ex_lead_budget_id is missing.")
        );
    if (!ex_interested_property_type_id)
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            false,
            false,
            [],
            "ex_interested_property_type_id is missing."
          )
        );
    if (!lead_project_id)
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "Project id is missing."));
    if (!lead_phase_id)
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "lead_phase_id is missing."));
    if (!lead_contact_meth)
      return res
        .status(201)
        .json(
          apiResponse(201, false, false, [], "lead_contact_meth is missing.")
        );
    t = await sequelize.transaction();
    const randomId = "LEAD" + randomStrNumeric(10);
    const project_name = await queryDb(
      " SELECT `pro_title` FROM `project_details` WHERE `pro_id` = ? LIMIT 1;",
      [Number(lead_project_id || 0)]
    );
    await queryDb(
      `
      INSERT INTO lead_basic_details(lead_unique_id,lead_cust_name,lead_project_id,lead_title,
      lead_mob_no,lead_alter_mob_no,lead_email,lead_contact_meth,lead_inserted_by,lead_insert_emp_id,
      lead_bkt_status,lead_cp_id)
           VALUE(?,?,?,?,?,?,?,?,2,?,2,?);
      `,
      [
        randomId,
        lead_cust_name || "",
        Number(lead_project_id || 0),
        project_name?.[0]?.pro_title,
        lead_mob_no || "",
        lead_alter_mob_no || "",
        lead_email || "",
        Number(lead_contact_meth || 0),
        Number(userId || 0),
        Number(lead_cp_id || 0),
      ]
    );
    const last_id = await queryDb("SELECT LAST_INSERT_ID() AS last_id;", []);
    const f_lead_id = last_id?.[0]?.last_id;
    await queryDb(
      "INSERT INTO `claimed_interested_leads`(`clm_lead_id`,`clm_emp_id`,`clm_curr_status`) VALUES(?,?,1);",
      [Number(f_lead_id), Number(userId)]
    );
    await queryDb(
      "INSERT INTO `lead_extended_info`(`ex_lead_id`,`ex_emp_id`,`ex_mobile`,`ex_alternate_mob`,`ex_email`,`ex_project_id`,`ex_phase_id`,`ex_interested_property_type_id`,`ex_lead_budget_id`) VALUES(?,?,?,?,?,?,?,?,?);",
      [
        Number(f_lead_id),
        Number(userId),
        lead_mob_no || "",
        lead_alter_mob_no || "",
        lead_email || "",
        Number(lead_project_id || 0),
        Number(lead_phase_id || 0),
        Number(ex_interested_property_type_id || 0),
        Number(ex_lead_budget_id || 0),
      ]
    );
    await t.commit();
    return res.status(201).json(apiResponse(201, false, true, [], dss));
  } catch (e) {
    console.log(e);
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.rescheduleLeads = async (req, res) => {
  const userId = req.userId;
  const { sch_id, sch_time } = req.body;
  let t;
  try {
    if (!sch_id)
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "sch_id is missing."));
    if (!sch_time)
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "sch_time is missing."));

    t = await sequelize.transaction();
    const isExist = await queryDb(
      "SELECT * FROM schedule_job WHERE sch_id = ? LIMIT 1",
      [Number(sch_id)]
    );
    if (!isExist.length) {
      await t.rollback();
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "Schedule Not Found"));
    }
    if (sch_time && dateTimeValidation("datetime", sch_time) !== "true") {
      const msg = dateTimeValidation("datetime", sch_time);
      await t.rollback();
      return res.status(201).json(apiResponse(201, false, false, [], msg));
    }

    await queryDb(
      "UPDATE `schedule_job` SET `sch_time` = ? WHERE `sch_id` = ? LIMIT 1;",
      [sch_time, Number(sch_id)]
    );
    const scheduldFor = isExist?.[0]?.schedule_for;
    let re = [
      sch_time,
      isExist?.[0]?.lead_id,
      Number(userId),
      isExist?.[0]?.sch_time,
    ];
    if (scheduldFor == "FollowUp") {
      await queryDb(
        "UPDATE `follow_up_leads` SET `fl_schedule_on` = ? WHERE `fl_lead_id` = ? AND `fl_emp_id` = ? AND `fl_schedule_on` = ? LIMIT 1;",
        re
      );
    } else if (scheduldFor == "Face to face") {
      await queryDb(
        "update `face_to_face` set `fac_schdule_date` = ? where `fac_lead_id` =? and `fac_emp_id` = ? and `fac_schdule_date` = ? limit 1;",
        re
      );
    } else if (scheduldFor == "site_visit") {
      await queryDb(
        "update `site_visit` set `st_vst_schdule_date` = ? where `st_vst_lead_id` = ? and `st_vst_emp_id` = ? and `st_vst_schdule_date` = ? limit 1;",
        re
      );
    }
    await scheduleTask();

    await t.commit();
    return res.status(201).json(apiResponse(201, false, true, [], dus));
  } catch (e) {
    console.log(e);
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.channepPartnerProfile = async (req, res) => {
  const userId = req.userId;
  const { cp_id } = req.query;
  let t;
  try {
    if (!cp_id)
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "cp_id is missing."));

    t = await sequelize.transaction();

    const result = await queryDb(
      "SELECT * FROM `channel_partner_profile` WHERE  cp_id  =? ;",
      [Number(cp_id)]
    );

    await t.commit();
    return res.status(201).json(apiResponse(201, false, true, result, dgs));
  } catch (e) {
    console.log(e);
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.empProfile = async (req, res) => {
  const userId = req.userId;
  let t;
  try {
    t = await sequelize.transaction();

    const result = await queryDb(
      "SELECT * FROM emp_profile WHERE emp_id = ?;",
      [Number(userId)]
    );

    await t.commit();
    return res.status(201).json(apiResponse(201, false, true, result, dgs));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.addUpdateNotes = async (req, res) => {
  const userId = req.userId;
  const { lead_id, description, nt_id } = req.body;
  let t;
  if (!lead_id || !description)
    return res
      .status(201)
      .json(
        apiResponse(
          201,
          false,
          false,
          [],
          "lead_id and descrition is required!"
        )
      );
  try {
    const isOwnLead = await queryDb(
      "SELECT `clm_id` FROM `claimed_interested_leads` WHERE `clm_lead_id` = ? AND `clm_emp_id` = ? LIMIT 1;",
      [Number(lead_id), Number(userId)]
    );
    if (isOwnLead.length === 0) {
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            false,
            false,
            [],
            "Oops!, This lead claimed by another employee."
          )
        );
    }

    t = await sequelize.transaction();

    if (nt_id && Number(nt_id) > 0) {
      await queryDb(
        "UPDATE `lead_notes` SET nt_description = ? WHERE nt_id = ? AND nt_emp_id = ?;",
        [description || "", Number(nt_id), Number(userId)]
      );
    } else {
      await queryDb(
        "INSERT INTO `lead_notes`(`nt_emp_id`,`nt_lead_id`,`nt_description`) VALUES(?,?,?);",
        [Number(userId), Number(lead_id), description || ""]
      );
    }

    await t.commit();
    return res
      .status(201)
      .json(apiResponse(201, false, true, [], nt_id ? dus : dss));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.getLeadNotes = async (req, res) => {
  const userId = req.userId;
  const { lead_id } = req.body;
  let t;

  try {
    t = await sequelize.transaction();
    let q = "SELECT * FROM lead_notes WHERE nt_emp_id = ? ";
    let re = [Number(userId)];
    if (lead_id) {
      q += " AND nt_lead_id = ? ";
      re.push(Number(lead_id));
    }
    q += " ORDER BY nt_id DESC ";
    const result = await queryDb(q, re);
    await t.commit();
    return res.status(201).json(apiResponse(201, false, true, result, dgs));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
// Follow-up types are DB-driven (`follow_up_types`) rather than a hardcoded
// list, so admins can add/retire types without a code change.
exports.followUpTypesList = async (req, res) => {
  try {
    const result = await queryDb(
      "SELECT `flw_typ_title`, `flw_typ_slug`, `flw_typ_is_visit` FROM `follow_up_types` WHERE `flw_typ_is_active` = 1 ORDER BY `flw_typ_id`;",
      []
    );
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};

// Structured follow-up log — replaces the free-text lead_notes chat on the
// employee "Update Follow" screen. Every submission is a new history row
// (no upsert), same accumulate-as-timeline semantics as lead_notes.
// Fixed permanent options for the independent "Status" field on the
// follow-up composer — separate from follow_type/the Next Appointment flow,
// so validated against this fixed list rather than the dynamic
// follow_up_types table (which drives an unrelated set of pickers).
const FOLLOW_STATUS_OPTIONS = [
  "Site Visit Done",
  "Office Group BOP Done",
  "Office One to One BOP Done",
  "Plot Meeting Done",
  "Online BOP Done",
];

exports.addLeadFollowup = async (req, res) => {
  const userId = req.userId;
  const {
    lead_id,
    follow_type,
    follow_status,
    remark,
    calling_done,
    next_appointment_date,
    location,
    meeting_mode,
    duration,
  } = req.body;

  if (follow_status && !FOLLOW_STATUS_OPTIONS.includes(follow_status)) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Invalid follow_status."));
  }

  if (!lead_id || !follow_type || !String(remark || "").trim()) {
    return res
      .status(201)
      .json(
        apiResponse(
          201,
          false,
          false,
          [],
          "lead_id, follow_type and remark are required!"
        )
      );
  }
  const activeTypes = await queryDb(
    "SELECT `flw_typ_title`, `flw_typ_is_visit` FROM `follow_up_types` WHERE `flw_typ_is_active` = 1;",
    []
  );
  const matchedType = activeTypes.find((t) => t.flw_typ_title === follow_type);
  if (!matchedType) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Invalid follow_type."));
  }
  const isVisitType = !!matchedType.flw_typ_is_visit;

  let t;
  try {
    const isOwnLead = await queryDb(
      "SELECT `clm_id` FROM `claimed_interested_leads` WHERE `clm_lead_id` = ? AND `clm_emp_id` = ? LIMIT 1;",
      [Number(lead_id), Number(userId)]
    );
    if (isOwnLead.length === 0) {
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            false,
            false,
            [],
            "Oops!, This lead claimed by another employee."
          )
        );
    }

    t = await sequelize.transaction();
    await queryDb(
      "INSERT INTO `lead_followups`(`follow_lead_id`,`follow_emp_id`,`follow_type`,`follow_status`,`follow_remark`,`follow_calling_done`,`follow_next_appointment_date`,`follow_location`,`follow_meeting_mode`,`follow_duration`) VALUES(?,?,?,?,?,?,?,?,?,?);",
      [
        Number(lead_id),
        Number(userId),
        follow_type,
        follow_status || null,
        String(remark).trim(),
        follow_type === "Calling" && calling_done !== "" && calling_done != null
          ? Number(calling_done) ? 1 : 0
          : null,
        next_appointment_date || null,
        isVisitType && location ? location : null,
        isVisitType && meeting_mode ? meeting_mode : null,
        isVisitType && duration ? duration : null,
      ]
    );
    await t.commit();
    return res.status(201).json(apiResponse(201, false, true, [], dss));
  } catch (e) {
    await t?.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};

// Powers the employee dashboard's "Pending Follow-ups" widget — leads
// currently claimed by this employee whose LATEST follow-up scheduled a next
// appointment for today. Logging a newer follow-up on that lead naturally
// clears it from this list (the "latest" row moves past today), so there's
// no separate "mark done" step.
exports.getTodaysPendingFollowupsEmp = async (req, res) => {
  const userId = req.userId;
  try {
    const result = await queryDb(
      `SELECT lb.lead_id, lb.lead_unique_id, lb.lead_cust_name, lb.lead_mob_no,
              lf.follow_type, lf.follow_next_appointment_date, lf.follow_remark
       FROM claimed_interested_leads c
       INNER JOIN lead_basic_details lb ON lb.lead_id = c.clm_lead_id
       INNER JOIN lead_followups lf ON lf.follow_id = (
         SELECT MAX(follow_id) FROM lead_followups WHERE follow_lead_id = lb.lead_id
       )
       WHERE c.clm_emp_id = ?
         AND lf.follow_next_appointment_date IS NOT NULL
         AND DATE(lf.follow_next_appointment_date) = CURDATE()
       ORDER BY lf.follow_next_appointment_date ASC;`,
      [Number(userId)]
    );
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};

exports.getLeadFollowups = async (req, res) => {
  const userId = req.userId;
  const { lead_id } = req.body;
  if (!lead_id) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "lead_id is required!"));
  }
  try {
    const isOwnLead = await queryDb(
      "SELECT `clm_id` FROM `claimed_interested_leads` WHERE `clm_lead_id` = ? AND `clm_emp_id` = ? LIMIT 1;",
      [Number(lead_id), Number(userId)]
    );
    if (isOwnLead.length === 0) {
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            false,
            false,
            [],
            "Oops!, This lead claimed by another employee."
          )
        );
    }
    const result = await queryDb(
      "SELECT * FROM `lead_followups` WHERE `follow_lead_id` = ? ORDER BY `follow_id` DESC;",
      [Number(lead_id)]
    );
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};

exports.leadTransferredHistory = async (req, res) => {
  const userId = req.userId;
  const { type } = req.query; // type 1 for transferred,2 for received
  let t;
  try {
    t = await sequelize.transaction();
    let q = "SELECT * FROM lead_transfer_history  ";
    if (type === 1) {
      q += "WHERE trf_from_id = ?";
    } else {
      q += "WHERE trf_to_id = ?";
    }
    let re = [Number(userId)];

    const result = await queryDb(q, re);
    await t.commit();
    return res.status(201).json(apiResponse(201, false, true, result, dgs));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.transferLead = async (req, res) => {
  const userId = req.userId;
  const { lead_id, receiver_id } = req.body;
  if (!lead_id || !receiver_id)
    return res
      .status(201)
      .json(
        apiResponse(
          201,
          false,
          false,
          [],
          "lead_id and receiver_id is required!"
        )
      );
  let t;

  try {
    t = await sequelize.transaction();
    let q =
      "SELECT `emp_id` FROM `emp_registration_details` WHERE `emp_unique_id` = ? AND `emp_lgn_status` = 1 LIMIT 1;";
    let re = [receiver_id];

    const result = await queryDb(q, re);
    if (result?.length === 0) {
      await t.rollback();
      return res
        .status(201)
        .json(apiResponse(201, false, false, [], "Receiver Not Found"));
    }
    const rece_id = result?.[0]?.emp_id;
    await queryDb(
      "INSERT INTO `lead_transferred_details`(`trf_lead_id`,`trf_from_id`,`trf_to_id`) VALUES(?,?,?);",
      [Number(lead_id), Number(userId), Number(rece_id)]
    );

    await queryDb(
      "UPDATE `lead_basic_details` SET `lead_is_transferred` = 1 WHERE `lead_id` = ? LIMIT 1;",
      [Number(lead_id)]
    );
    await queryDb(
      "INSERT INTO `claimed_interested_leads`(`clm_lead_id`,`clm_emp_id`,`clm_curr_status`) VALUES(?,?,?);",
      [Number(lead_id), Number(rece_id), 1]
    );
    await t.commit();
    return res
      .status(201)
      .json(apiResponse(201, false, true, [], "transferred Successfully!"));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
