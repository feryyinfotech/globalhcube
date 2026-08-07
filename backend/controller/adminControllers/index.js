"user-strict";
const { apiResponse } = require("../../helper/helperResponse");
const path = require("path");
const {
  queryDb,
  randomStrAlphabetNumeric,
  deCryptData,
  enCryptData,
  randomStrNumeric,
} = require("../../helper/utilityHelper");
const { authenticator } = require("otplib");
const qrcode = require("qrcode");
const XLSX = require("xlsx");
const {
  dgs,
  sww,
  sr,
  dus,
  dss,
  pas,
  rae,
  etr,
  pfod,
  ndf,
} = require("../../msgHelper");
const sequelize = require("../../config/seq.config");
const {
  empRegistrationValidation,
  leadValidationSchema,
} = require("../../utils/Validation");
const moment = require("moment");
const { getSocketIO } = require("../../config/io.config");
const {
  sendPushNotification,
  sendNotificationToEmp,
} = require("../../utils/SendNotification");
const scheduleTask = require("../../utils/ScheduleJob");
const dateTimeValidation = require("../../utils/DateTImeValidation");
const { ensureUpload } = require("../../utils/HandleFiles");
const { ActivityLogsFuns } = require("../../utils/ActivityLogs");
const { SELECT } = require("sequelize/lib/query-types");

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const q =
      "SELECT `ad_lgn_id` ,`ad_lgn_token` , `ad_lgn_email`, `ad_lgn_type` FROM `admin_login` WHERE (`ad_lgn_email` = ? OR `ad_lgn_mobile` = ?) AND `ad_lgn_pass` = ? LIMIT 1;";
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
    // const token = randomStrAlphabetNumeric(100);
    const adminEmail = data[0].ad_lgn_email;
    // await queryDb(
    //   "UPDATE `admin_login` SET `ad_lgn_token` = ? WHERE ad_lgn_id = ?;",
    //   [token, data?.[0]?.ad_lgn_id]
    // );
    return res
      .status(200)
      .json(
        apiResponse(
          200,
          false,
          true,
          [
            {
              token: data[0].ad_lgn_token,
              email: adminEmail,
              user_type: data[0].ad_lgn_type,
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
//anand
// exports.adminLogin = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const q =
//       "SELECT `ad_lgn_id` FROM `admin_login` WHERE (`ad_lgn_email` = ? OR `ad_lgn_mobile` = ?) AND `ad_lgn_pass` = ? LIMIT 1;";
//     const data = await queryDb(q, [username, username, password]);
//     if (data?.length === 0)
//       return res
//         .status(201)
//         .json(
//           apiResponse(
//             201,
//             false,
//             false,
//             [],
//             "Credential not found in our record"
//           )
//         );
//     const token = randomStrAlphabetNumeric(100);
//     await queryDb(
//       "UPDATE `admin_login` SET `ad_lgn_token` = ? WHERE ad_lgn_id = ?;",
//       [token, data?.[0]?.ad_lgn_id]
//     );
//     return res
//       .status(200)
//       .json(apiResponse(200, false, true, [{ token }], "Login Successfully"));
//   } catch (e) {
//     return res
//       .status(500)
//       .json(apiResponse(500, true, false, [], e.message + sr || sww));
//   }
// };
exports.employeeRegistration = async (req, res) => {
  const {
    mobile,
    name,
    address = "",
    email = "",
    password,
    sponsor_name = "",
    team_name = "",
    city_name = "",
    state_name = "",
    work_preference = "",
  } = req.body;
  if (!mobile || !password)
    return res
      .status(201)
      .json(
        apiResponse(201, false, false, [], "mobile and password is required!")
      );
  let t;
  try {
    t = await sequelize.transaction();
    const isAlreadExist = await queryDb(
      "SELECT * FROM `emp_login` WHERE `lgn_mob` = ? LIMIT 1;",
      [mobile]
    );
    if (isAlreadExist?.length > 0) {
      await t?.rollback();
      return res.status(201)?.json(apiResponse(201, false, false, [], rae));
    }
    let randomId = "EMP" + randomStrNumeric(10);
    await queryDb(
      "INSERT INTO `emp_login`(`lgn_mob`,`lgn_email`,`lgn_pass`,lgn_emp_unique_id) values(?,?,?,?);",
      [mobile, email, password, randomId]
    );
    const last_id = await queryDb("SELECT LAST_INSERT_ID() as id;", []);
    const q =
      "INSERT INTO `emp_registration_details`(`emp_lgn_id`,`emp_name`,`emp_mobile`,`emp_email`,emp_pass,`emp_address`,emp_unique_id,`emp_sponsor_name`,`emp_team_name`,`emp_city_name`,`emp_state_name`,`emp_work_preference`) VALUES(?,?,?,?,?,?,?,?,?,?,?,?);";
    await queryDb(q, [
      last_id[0].id,
      name,
      mobile,
      email,
      password,
      address,
      randomId,
      sponsor_name,
      team_name,
      city_name,
      state_name,
      work_preference,
    ]);
    (await t)?.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    await t?.rollback();
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.updateEmployeeDetails = async (req, res) => {
  const {
    emp_id,
    mobile,
    name,
    address = "",
    email = "",
    password = "",
    sponsor_name = "",
    team_name = "",
    city_name = "",
    state_name = "",
    work_preference = "",
  } = req.body;
  if (!emp_id || !mobile || !name)
    return res
      .status(201)
      .json(
        apiResponse(201, false, false, [], "emp_id, name and mobile is required!")
      );
  let t;
  try {
    const existing = await queryDb(
      "SELECT * FROM `emp_registration_details` WHERE emp_id = ? LIMIT 1;",
      [emp_id]
    );
    if (!existing?.length) {
      return res
        .status(404)
        .json(apiResponse(404, false, false, [], "Employee not found"));
    }
    // Only check for a mobile-number conflict if the mobile is actually being
    // changed — some historical employee records already share a mobile
    // number (bad old data), and that pre-existing collision shouldn't block
    // edits to unrelated fields on those employees.
    if (mobile !== existing[0].emp_mobile) {
      const dupeCheck = await queryDb(
        "SELECT * FROM `emp_login` WHERE `lgn_mob` = ? AND `lgn_id` != ? LIMIT 1;",
        [mobile, existing[0].emp_lgn_id]
      );
      if (dupeCheck?.length > 0) {
        return res.status(201)?.json(apiResponse(201, false, false, [], rae));
      }
    }

    t = await sequelize.transaction();
    await queryDb(
      `UPDATE \`emp_registration_details\` SET \`emp_name\` = ?, \`emp_mobile\` = ?, \`emp_email\` = ?, \`emp_address\` = ?, \`emp_sponsor_name\` = ?, \`emp_team_name\` = ?, \`emp_city_name\` = ?, \`emp_state_name\` = ?, \`emp_work_preference\` = ?${
        password ? ", `emp_pass` = ?" : ""
      } WHERE emp_id = ?;`,
      [
        name,
        mobile,
        email,
        address,
        sponsor_name,
        team_name,
        city_name,
        state_name,
        work_preference,
        ...(password ? [password] : []),
        emp_id,
      ]
    );
    await queryDb(
      `UPDATE \`emp_login\` SET \`lgn_mob\` = ?, \`lgn_email\` = ?${
        password ? ", `lgn_pass` = ?" : ""
      } WHERE lgn_id = ?;`,
      [mobile, email, ...(password ? [password] : []), existing[0].emp_lgn_id]
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
// Lets an admin "log in as" a chosen employee — issues that employee a fresh
// login token (same mechanism as their own emp-login), which the frontend
// then stores and uses to view the app exactly as that employee would.
exports.adminLoginAsEmployee = async (req, res) => {
  try {
    const { emp_id } = req.body;
    if (!emp_id) {
      return res.status(201).json(apiResponse(201, true, false, [], etr));
    }
    const emp = await queryDb(
      "SELECT `emp_id`,`emp_unique_id`,`emp_name`,`emp_lgn_id`,`emp_lgn_status` FROM `emp_registration_details` WHERE `emp_id` = ? LIMIT 1;",
      [Number(emp_id)]
    );
    if (!emp?.length) {
      return res
        .status(404)
        .json(apiResponse(404, false, false, [], "Employee not found"));
    }
    if (emp[0].emp_lgn_status === "Deactive") {
      return res
        .status(201)
        .json(
          apiResponse(201, false, false, [], "This employee is deactivated.")
        );
    }
    const token = randomStrAlphabetNumeric(100);
    await queryDb("UPDATE `emp_login` SET `lgn_token` = ? WHERE lgn_id = ?;", [
      token,
      emp[0].emp_lgn_id,
    ]);
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        [
          {
            token,
            emp_name: emp[0].emp_name,
            emp_unique_id: emp[0].emp_unique_id,
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
exports.employeeList = async (req, res) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
    } = req.body; // ROI,LEVEL,DIRECT,MATCHING,BOOSTER,WEEKLY
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = "SELECT COUNT(*) AS cnt FROM `emp_registration_details` ";
    let baseQuery =
      "select emp_unique_id,emp_id,`emp_name`,`emp_mobile`,`emp_email`,`emp_pass`,`emp_address`,`emp_sponsor_name`,`emp_team_name`,`emp_city_name`,`emp_state_name`,`emp_work_preference`,`emp_lgn_status` FROM `emp_registration_details` ";
    let reP = [];
    let reB = [];
    if (start_date && end_date) {
      countQuery +=
        "WHERE  DATE(emp_created_at) >= ? AND DATE(emp_created_at) <= ? ";
      baseQuery +=
        " WHERE DATE(emp_created_at) >= ? AND DATE(emp_created_at) <= ? ";
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
        " WHERE (emp_email LIKE ? OR emp_name LIKE ? OR emp_mobile LIKE ? OR emp_address LIKE ? OR emp_lgn_status LIKE ?) ";
      baseQuery +=
        " WHERE (emp_email LIKE ? OR emp_name LIKE ? OR emp_mobile LIKE ? OR emp_address LIKE ? OR emp_lgn_status LIKE ?) ";
      reP.push(
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
        `%${search}%`
      );
    }
    baseQuery += " ORDER BY `emp_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
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
exports.channelPartnerList = async (req, res) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
    } = req.body;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = "SELECT COUNT(*) AS cnt FROM `channel_partner_list` ";
    let baseQuery = `SELECT * FROM channel_partner_list `;
    let reP = [];
    let reB = [];
    if (start_date && end_date) {
      countQuery +=
        "WHERE  DATE(cp_created_at) >= ? AND DATE(cp_created_at) <= ? ";
      baseQuery +=
        " WHERE DATE(cp_created_at) >= ? AND DATE(cp_created_at) <= ? ";
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
        " WHERE (cp_name LIKE ? OR cp_email LIKE ? OR cp_mobile_no LIKE ? OR cp_firm_name LIKE ? OR cp_unique_id LIKE ?) ";
      baseQuery +=
        " WHERE (cp_name LIKE ? OR cp_email LIKE ? OR cp_mobile_no LIKE ? OR cp_firm_name LIKE ? OR cp_unique_id LIKE ?) ";
      reP.push(
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
        `%${search}%`
      );
    }
    baseQuery += " ORDER BY cp_id DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
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
exports.employeeLoginStatus = async (req, res) => {
  try {
    const { emp_id } = req.query;
    if (!emp_id)
      return res.status(201).json(apiResponse(201, true, false, [], etr));
    const q =
      "UPDATE `emp_registration_details` SET `emp_lgn_status` =  CASE WHEN emp_lgn_status = 1 THEN 2 ELSE 1 END WHERE emp_id = ?;";
    await queryDb(q, [Number(emp_id)]);
    await queryDb(
      "UPDATE `emp_login` SET `lgn_status` = CASE WHEN lgn_status= 1 THEN 2 ELSE 1 END WHERE  lgn_id = (SELECT emp_lgn_id FROM emp_registration_details WHERE emp_id = ?);",
      [Number(emp_id)]
    );
    return res.status(200).json(apiResponse(200, false, true, [], dus));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.createlLeadSource = async (req, res) => {
  const { ld_src_name, ld_src_des } = req.body;
  const t = await sequelize.transaction();
  try {
    await queryDb(
      "INSERT INTO `lead_source`(`ld_src_name`,`ld_src_desc`) VALUES(?,?);",
      [ld_src_name?.trim(), ld_src_des?.trim()]
    );
    (await t)?.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    (await t)?.rollback();
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.sourceLeadList = async (req, res) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
    } = req.body;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = "SELECT COUNT(*) AS cnt FROM `lead_source` ";
    let baseQuery =
      "select ld_src_id,`ld_src_name`,`ld_src_desc`,ld_src_status FROM `lead_source` ";
    let reP = [];
    let reB = [];
    if (start_date && end_date) {
      countQuery +=
        "WHERE  DATE(ld_src_created_at) >= ? AND DATE(ld_src_created_at) <= ? ";
      baseQuery +=
        " WHERE DATE(ld_src_created_at) >= ? AND DATE(ld_src_created_at) <= ? ";
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
        " WHERE (ld_src_name LIKE ? OR ld_src_desc LIKE ? OR ld_src_status = ?) ";
      baseQuery +=
        " WHERE (ld_src_name LIKE ? OR ld_src_desc LIKE ? OR ld_src_status  = ?) ";
      reP.push(`%${search}%`, `%${search}%`, `%${search}%`);
      reB.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    baseQuery += " ORDER BY `ld_src_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
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
exports.leadSourceStatus = async (req, res) => {
  try {
    const { ld_src_id } = req.query;
    if (!ld_src_id)
      return res.status(201).json(apiResponse(201, true, false, [], etr));
    const q =
      "UPDATE `lead_source` SET `ld_src_status` =  CASE WHEN ld_src_status = 1 THEN 2 ELSE 1 END WHERE ld_src_id = ?;";
    await queryDb(q, [Number(ld_src_id)]);

    return res.status(200).json(apiResponse(200, false, true, [], dus));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.sourceLeadListForLeadCreation = async (req, res) => {
  try {
    const result = await queryDb(
      "SELECT `ld_src_id`,`ld_src_name` FROM `lead_source` WHERE ld_src_status = 1;",
      []
    );
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};
exports.contactMethodListForLeadCreation = async (req, res) => {
  try {
    const result = await queryDb(
      "SELECT ld_cont_id,`ld_cont_name` FROM `lead_contact_method` WHERE `ld_cont_status` = 1;",
      []
    );
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

// Structured follow-up "type" filter — independent of lead_type (Hot/Cold/etc).
// Matches leads whose LATEST lead_followups row is of the given type.
const FOLLOWUP_TYPE_FILTER_CONDITION =
  "lead_id IN (SELECT lf.follow_lead_id FROM lead_followups lf INNER JOIN (SELECT follow_lead_id, MAX(follow_id) AS max_id FROM lead_followups GROUP BY follow_lead_id) latest ON latest.max_id = lf.follow_id WHERE lf.follow_type = ?)";

exports.basicLeadList = async (req, res) => {
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
    // console.log(lead_type);
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `SELECT COUNT(*) AS cnt FROM basic_lead_list `;
    let baseQuery = `SELECT * FROM basic_lead_list `;
    let reP = [];
    let reB = [];
    let hasWhere = false;
    const appendCondition = (condition) => {
      const clause = ` ${hasWhere ? "AND" : "WHERE"} ${condition} `;
      countQuery += clause;
      baseQuery += clause;
      hasWhere = true;
    };
    // Basic Lead only shows leads that have been assigned to a *currently
    // existing* employee. Some old claim rows point at emp_ids that were
    // later deleted from emp_registration_details (orphaned claims) — those
    // must NOT count as "assigned" here, so the INNER JOIN below excludes them.
    appendCondition(
      "EXISTS (SELECT 1 FROM claimed_interested_leads c INNER JOIN emp_registration_details e ON e.emp_id = c.clm_emp_id WHERE c.clm_lead_id = lead_id)"
    );
    if (start_date && end_date) {
      appendCondition("DATE(lead_created_at) >= ? AND DATE(lead_created_at) <= ?");
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
      appendCondition(
        "(lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_title LIKE ? OR lead_sort_des LIKE ? OR lead_mob_no LIKE ? OR lead_alter_mob_no LIKE ? OR lead_email LIKE ? OR ld_cont_name LIKE ? OR ld_src_name LIKE ?)"
      );
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
    if (lead_type === "FRESH") {
      // "Fresh" = assigned but no follow-up has happened yet.
      appendCondition(
        "NOT EXISTS (SELECT 1 FROM lead_followups WHERE follow_lead_id = lead_id)"
      );
    } else if (lead_type !== "ALL" && !Number.isNaN(Number(lead_type))) {
      appendCondition("lead_bkt_status = ?");
      reB.push(Number(lead_type));
      reP.push(Number(lead_type));
    }
    if (followup_type && followup_type !== "ALL") {
      appendCondition(FOLLOWUP_TYPE_FILTER_CONDITION);
      reB.push(followup_type);
      reP.push(followup_type);
    }

    baseQuery += " ORDER BY `lead_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);

    // Fetch follow-up counts and the claiming employee as separate, fast queries
    // scoped to just this page's leads — joining these directly onto basic_lead_list
    // (an already multi-join VIEW over 100k+ rows) made the whole request take seconds.
    const leadIds = result.map((r) => r.lead_id);
    let followupCountByLeadId = {};
    let empByLeadId = {};
    let latestFollowupByLeadId = {};
    if (leadIds.length > 0) {
      const idPlaceholders = leadIds.map(() => "?").join(",");
      const [followupRows, empRows, latestFollowupRows] = await Promise.all([
        queryDb(
          `SELECT follow_lead_id AS fl_lead_id, COUNT(*) AS cnt FROM lead_followups WHERE follow_lead_id IN (${idPlaceholders}) GROUP BY follow_lead_id;`,
          leadIds
        ),
        queryDb(
          `SELECT clm_lead_id, emp_registration_details.emp_id, emp_name, emp_mobile
           FROM claimed_interested_leads
           INNER JOIN emp_registration_details ON emp_registration_details.emp_id = claimed_interested_leads.clm_emp_id
           WHERE clm_lead_id IN (${idPlaceholders});`,
          leadIds
        ),
        // Latest row per lead from the structured follow-up log (lead_followups) —
        // MAX(follow_id) is used instead of MAX(created_at) since it's a sequential
        // auto-increment and cheaper/unambiguous to compare.
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
      ]);
      followupCountByLeadId = followupRows.reduce((acc, row) => {
        acc[row.fl_lead_id] = row.cnt;
        return acc;
      }, {});
      empByLeadId = empRows.reduce((acc, row) => {
        acc[row.clm_lead_id] = row;
        return acc;
      }, {});
      latestFollowupByLeadId = latestFollowupRows.reduce((acc, row) => {
        acc[row.follow_lead_id] = row;
        return acc;
      }, {});
    }
    const resultWithFollowupCount = result.map((row) => {
      const emp = empByLeadId[row.lead_id];
      const latestFollowup = latestFollowupByLeadId[row.lead_id];
      return {
        ...row,
        followup_count: Number(followupCountByLeadId[row.lead_id]) || 0,
        emp_id: emp?.emp_id || null,
        emp_name: emp?.emp_name || null,
        emp_mobile: emp?.emp_mobile || null,
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
          data: resultWithFollowupCount,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        dgs
      )
    );
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};
// Powers the "Lead Report" page — every lead regardless of assignment status
// (unlike basicLeadList above, which only shows leads claimed by a still-
// existing employee). Same filters/search/pagination shape as basicLeadList
// so the frontend can reuse that page's query patterns.
exports.leadReportList = async (req, res) => {
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

    let countQuery = `SELECT COUNT(*) AS cnt FROM basic_lead_list `;
    let baseQuery = `SELECT * FROM basic_lead_list `;
    let reP = [];
    let reB = [];
    let hasWhere = false;
    const appendCondition = (condition) => {
      const clause = ` ${hasWhere ? "AND" : "WHERE"} ${condition} `;
      countQuery += clause;
      baseQuery += clause;
      hasWhere = true;
    };
    if (start_date && end_date) {
      appendCondition("DATE(lead_created_at) >= ? AND DATE(lead_created_at) <= ?");
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
      appendCondition(
        "(lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_title LIKE ? OR lead_sort_des LIKE ? OR lead_mob_no LIKE ? OR lead_alter_mob_no LIKE ? OR lead_email LIKE ? OR ld_cont_name LIKE ? OR ld_src_name LIKE ?)"
      );
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
    if (lead_type === "FRESH") {
      appendCondition(
        "NOT EXISTS (SELECT 1 FROM lead_followups WHERE follow_lead_id = lead_id)"
      );
    } else if (lead_type !== "ALL" && !Number.isNaN(Number(lead_type))) {
      appendCondition("lead_bkt_status = ?");
      reB.push(Number(lead_type));
      reP.push(Number(lead_type));
    }
    if (followup_type && followup_type !== "ALL") {
      appendCondition(FOLLOWUP_TYPE_FILTER_CONDITION);
      reB.push(followup_type);
      reP.push(followup_type);
    }

    baseQuery += " ORDER BY `lead_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);

    // Same page-scoped follow-up-count / claiming-employee enrichment as
    // basicLeadList — emp_* fields simply come back null for unclaimed leads.
    const leadIds = result.map((r) => r.lead_id);
    let followupCountByLeadId = {};
    let empByLeadId = {};
    let latestFollowupByLeadId = {};
    if (leadIds.length > 0) {
      const idPlaceholders = leadIds.map(() => "?").join(",");
      const [followupRows, empRows, latestFollowupRows] = await Promise.all([
        queryDb(
          `SELECT follow_lead_id AS fl_lead_id, COUNT(*) AS cnt FROM lead_followups WHERE follow_lead_id IN (${idPlaceholders}) GROUP BY follow_lead_id;`,
          leadIds
        ),
        queryDb(
          `SELECT clm_lead_id, emp_registration_details.emp_id, emp_name, emp_mobile
           FROM claimed_interested_leads
           INNER JOIN emp_registration_details ON emp_registration_details.emp_id = claimed_interested_leads.clm_emp_id
           WHERE clm_lead_id IN (${idPlaceholders});`,
          leadIds
        ),
        // Latest row per lead from the structured follow-up log (lead_followups) —
        // MAX(follow_id) is used instead of MAX(created_at) since it's a sequential
        // auto-increment and cheaper/unambiguous to compare.
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
      ]);
      followupCountByLeadId = followupRows.reduce((acc, row) => {
        acc[row.fl_lead_id] = row.cnt;
        return acc;
      }, {});
      empByLeadId = empRows.reduce((acc, row) => {
        acc[row.clm_lead_id] = row;
        return acc;
      }, {});
      latestFollowupByLeadId = latestFollowupRows.reduce((acc, row) => {
        acc[row.follow_lead_id] = row;
        return acc;
      }, {});
    }
    const resultWithFollowupCount = result.map((row) => {
      const emp = empByLeadId[row.lead_id];
      const latestFollowup = latestFollowupByLeadId[row.lead_id];
      return {
        ...row,
        followup_count: Number(followupCountByLeadId[row.lead_id]) || 0,
        emp_id: emp?.emp_id || null,
        emp_name: emp?.emp_name || null,
        emp_mobile: emp?.emp_mobile || null,
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
          data: resultWithFollowupCount,
          totalRows,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        dgs
      )
    );
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};
// Powers the dynamic per-follow-up-type sidebar menus (Calling / BOP Done /
// Site Visit Done / Office Meeting Done / Home BOP Done). Unlike
// FOLLOWUP_TYPE_FILTER_CONDITION (latest-only), this matches any lead that
// has EVER had a follow-up of the given type in its history — a lead that
// moved on to a later follow-up type still shows up here. Shows all
// employees' data, same as leadReportList (no ownership gate).
exports.leadsByFollowupType = async (req, res) => {
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

    let countQuery = `SELECT COUNT(*) AS cnt FROM basic_lead_list `;
    let baseQuery = `SELECT * FROM basic_lead_list `;
    let reP = [];
    let reB = [];
    let hasWhere = false;
    const appendCondition = (condition) => {
      const clause = ` ${hasWhere ? "AND" : "WHERE"} ${condition} `;
      countQuery += clause;
      baseQuery += clause;
      hasWhere = true;
    };
    appendCondition(
      `lead_id IN (SELECT DISTINCT follow_lead_id FROM lead_followups WHERE ${matchClause})`
    );
    reP.push(...matchParams);
    reB.push(...matchParams);
    if (search) {
      appendCondition(
        "(lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_title LIKE ? OR lead_sort_des LIKE ? OR lead_mob_no LIKE ? OR lead_alter_mob_no LIKE ? OR lead_email LIKE ? OR ld_cont_name LIKE ? OR ld_src_name LIKE ?)"
      );
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
    let empByLeadId = {};
    let latestFollowupByLeadId = {};
    // The lead's overall latest follow-up may be a LATER type than the one
    // this page is filtered to (e.g. a "Site Visit Done" lead that has since
    // moved on to "Calling"). This second lookup is the latest entry OF THIS
    // SPECIFIC TYPE per lead, so the page can show that follow-up's own
    // remark/time/visit-details instead of whatever came after it.
    let typeFollowupByLeadId = {};
    if (leadIds.length > 0) {
      const idPlaceholders = leadIds.map(() => "?").join(",");
      const [empRows, latestFollowupRows, typeFollowupRows] = await Promise.all([
        queryDb(
          `SELECT clm_lead_id, emp_registration_details.emp_id, emp_name, emp_mobile
           FROM claimed_interested_leads
           INNER JOIN emp_registration_details ON emp_registration_details.emp_id = claimed_interested_leads.clm_emp_id
           WHERE clm_lead_id IN (${idPlaceholders});`,
          leadIds
        ),
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
      empByLeadId = empRows.reduce((acc, row) => {
        acc[row.clm_lead_id] = row;
        return acc;
      }, {});
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
      const emp = empByLeadId[row.lead_id];
      const latestFollowup = latestFollowupByLeadId[row.lead_id];
      const typeFollowup = typeFollowupByLeadId[row.lead_id];
      return {
        ...row,
        emp_id: emp?.emp_id || null,
        emp_name: emp?.emp_name || null,
        emp_mobile: emp?.emp_mobile || null,
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
    console.log(e);
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

// Powers the "Assign Leads" page — leads that have NOT been assigned to any
// employee yet (no row in claimed_interested_leads). Mirrors basicLeadList's
// query shape but with the opposite (NOT EXISTS) filter, and no lead_type
// filter since these leads have no meaningful status yet.
exports.unassignedLeadList = async (req, res) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
    } = req.body;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `SELECT COUNT(*) AS cnt FROM basic_lead_list `;
    let baseQuery = `SELECT * FROM basic_lead_list `;
    let reP = [];
    let reB = [];
    let hasWhere = false;
    const appendCondition = (condition) => {
      const clause = ` ${hasWhere ? "AND" : "WHERE"} ${condition} `;
      countQuery += clause;
      baseQuery += clause;
      hasWhere = true;
    };
    // A lead whose only claim points at a since-deleted employee (orphaned
    // claim) should still count as unassigned here — the INNER JOIN below
    // requires the claimed employee to actually still exist.
    appendCondition(
      "NOT EXISTS (SELECT 1 FROM claimed_interested_leads c INNER JOIN emp_registration_details e ON e.emp_id = c.clm_emp_id WHERE c.clm_lead_id = lead_id)"
    );
    if (start_date && end_date) {
      appendCondition("DATE(lead_created_at) >= ? AND DATE(lead_created_at) <= ?");
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
      appendCondition(
        "(lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_title LIKE ? OR lead_sort_des LIKE ? OR lead_mob_no LIKE ? OR lead_alter_mob_no LIKE ? OR lead_email LIKE ? OR ld_cont_name LIKE ? OR ld_src_name LIKE ?)"
      );
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

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        dgs
      )
    );
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};
// Assigns an unassigned lead to an employee (from the "Assign Leads" page).
// Once assigned, the lead disappears from unassignedLeadList and appears in
// basicLeadList instead — both derive their filter from claimed_interested_leads.
exports.assignLeadToEmployee = async (req, res) => {
  try {
    const { lead_id, emp_id } = req.body;
    if (!lead_id || !emp_id) {
      return res.status(201).json(apiResponse(201, true, false, [], etr));
    }
    const already = await queryDb(
      "SELECT clm_id FROM claimed_interested_leads WHERE clm_lead_id = ? LIMIT 1;",
      [Number(lead_id)]
    );
    if (already?.length > 0) {
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            false,
            false,
            [],
            "This lead is already assigned to an employee."
          )
        );
    }
    await queryDb(
      "INSERT INTO `claimed_interested_leads`(`clm_lead_id`,`clm_emp_id`,`clm_curr_status`) VALUES(?,?,?);",
      [Number(lead_id), Number(emp_id), 1]
    );
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};
// Powers the "Transfer Lead" page — lists only ALREADY-ASSIGNED leads along
// with their current owner, so an admin can move a lead to a different
// employee. Unassigned leads are deliberately excluded — those belong on the
// separate "Assign Leads" page instead.
exports.leadListForTransfer = async (req, res) => {
  try {
    const { search = "", page = 1, count = 10 } = req.body;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `SELECT COUNT(*) AS cnt FROM basic_lead_list `;
    let baseQuery = `SELECT * FROM basic_lead_list `;
    let reP = [];
    let reB = [];
    let hasWhere = false;
    const appendCondition = (condition) => {
      const clause = ` ${hasWhere ? "AND" : "WHERE"} ${condition} `;
      countQuery += clause;
      baseQuery += clause;
      hasWhere = true;
    };
    // Same orphaned-claim exclusion as basicLeadList/unassignedLeadList —
    // a claim pointing at a deleted employee doesn't count as "assigned".
    appendCondition(
      "EXISTS (SELECT 1 FROM claimed_interested_leads c INNER JOIN emp_registration_details e ON e.emp_id = c.clm_emp_id WHERE c.clm_lead_id = lead_id)"
    );
    if (search) {
      appendCondition(
        "(lead_cust_name LIKE ? OR lead_unique_id LIKE ? OR lead_mob_no LIKE ?)"
      );
      reP.push(`%${search}%`, `%${search}%`, `%${search}%`);
      reB.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    baseQuery += " ORDER BY `lead_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);

    const leadIds = result.map((r) => r.lead_id);
    let empByLeadId = {};
    if (leadIds.length > 0) {
      const idPlaceholders = leadIds.map(() => "?").join(",");
      const empRows = await queryDb(
        `SELECT clm_lead_id, emp_registration_details.emp_id, emp_name, emp_mobile
         FROM claimed_interested_leads
         INNER JOIN emp_registration_details ON emp_registration_details.emp_id = claimed_interested_leads.clm_emp_id
         WHERE clm_lead_id IN (${idPlaceholders});`,
        leadIds
      );
      empByLeadId = empRows.reduce((acc, row) => {
        acc[row.clm_lead_id] = row;
        return acc;
      }, {});
    }
    const resultWithEmp = result.map((row) => {
      const emp = empByLeadId[row.lead_id];
      return {
        ...row,
        emp_id: emp?.emp_id || null,
        emp_name: emp?.emp_name || null,
        emp_mobile: emp?.emp_mobile || null,
      };
    });

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: resultWithEmp,
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
// Moves a lead's ownership to a different employee. Unlike assignLeadToEmployee
// (which rejects leads that already have an owner), this overwrites any
// existing claim — that's the whole point of "transfer".
exports.transferLeadToEmployee = async (req, res) => {
  try {
    const { lead_id, emp_id } = req.body;
    if (!lead_id || !emp_id) {
      return res.status(201).json(apiResponse(201, true, false, [], etr));
    }
    const existing = await queryDb(
      "SELECT clm_id FROM claimed_interested_leads WHERE clm_lead_id = ? LIMIT 1;",
      [Number(lead_id)]
    );
    if (existing?.length > 0) {
      await queryDb(
        "UPDATE `claimed_interested_leads` SET `clm_emp_id` = ? WHERE clm_lead_id = ?;",
        [Number(emp_id), Number(lead_id)]
      );
    } else {
      await queryDb(
        "INSERT INTO `claimed_interested_leads`(`clm_lead_id`,`clm_emp_id`,`clm_curr_status`) VALUES(?,?,?);",
        [Number(lead_id), Number(emp_id), 1]
      );
    }
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};
exports.claimedListAdmin = async (req, res) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
      lead_type = "2", // 1: New, 2: Cold, 3: Warm, 4: Close, 5: Convert, 6: Hot — TODO: confirm default "2" (old "Claimed") still makes sense in new status model
    } = req.body;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `SELECT COUNT(*) AS cnt FROM lead_basic_details
          INNER JOIN lead_contact_method ON lead_contact_meth = ld_cont_id
          INNER JOIN lead_source ON ld_src_id = lead_source 
          INNER JOIN lead_bucket_status ON ld_bkt_id = lead_bkt_status
          INNER JOIN  claimed_interested_leads ON clm_lead_id = lead_id 
          INNER JOIN emp_registration_details ON emp_id = clm_emp_id  Where lead_id = lead_id `;
    let baseQuery = `SELECT  
              lead_cust_name,
              lead_id,
              lead_unique_id,
              lead_title,
              lead_sort_des,
              lead_mob_no,
              lead_alter_mob_no,
              lead_email,
              lead_created_at,
              ld_cont_name,
              ld_src_name,
              ld_bkt_status,
              ld_bkt_st_slug,
              GROUP_CONCAT(
                CONCAT(
                  '{',
                    '"emp_unique_id":"', emp_unique_id, '",',
                    '"emp_name":"', emp_name, '",',
                    '"emp_mobile":"', emp_mobile, '",',
                    '"emp_email":"', emp_email, '"',
                  '}'
                )
              ) AS emp_details,
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
            INNER JOIN lead_contact_method ON lead_contact_meth = ld_cont_id
            INNER JOIN lead_source ON ld_src_id = lead_source 
            INNER JOIN lead_bucket_status ON ld_bkt_id = lead_bkt_status 
            INNER JOIN claimed_interested_leads ON clm_lead_id = lead_id
            INNER JOIN emp_registration_details ON emp_id = clm_emp_id
            LEFT JOIN project_details ON pro_id = lead_project_id  Where lead_id = lead_id
          `;
    let reP = [];
    let reB = [];
    if (start_date && end_date) {
      countQuery +=
        "AND  DATE(lead_created_at) >= ? AND DATE(lead_created_at) <= ? ";
      baseQuery +=
        " AND DATE(lead_created_at) >= ? AND DATE(lead_created_at) <= ? ";
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

    baseQuery += " GROUP BY lead_id ORDER BY `lead_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
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

exports.createLeadByAdminmanual = async (req, res) => {
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
    lead_assign_to: lead_assign_id = "", // employee id to assign this lead to (frontend field is named lead_assign_to)
    lead_business = "",
    lead_gender = "",
    lead_city = "",
    lead_state = "",
    lead_country = "",
    lead_bkt_status = "", // 1: New, 2: Cold, 3: Warm, 4: Close, 5: Convert, 6: Hot
  } = req.body;
  if (
    !lead_mob_no ||
    !lead_source ||
    !lead_project_id
  ) {
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
    // Assigning an employee is optional — only treat it as set if it's a real, valid id.
    const assignEmpId =
      lead_assign_id && !Number.isNaN(Number(lead_assign_id))
        ? Number(lead_assign_id)
        : null;
    // Lead type at creation is optional — New/Cold/Warm/Hot/Close/Convert are
    // all valid choices from the create-lead form; default to New (1) when unset.
    const validBktStatuses = [1, 2, 3, 4, 5, 6];
    const leadBktStatus = validBktStatuses.includes(Number(lead_bkt_status))
      ? Number(lead_bkt_status)
      : 1;
    const q =
      "INSERT INTO `lead_basic_details`(`lead_unique_id`,lead_cust_name,lead_project_id,lead_insert_emp_id,`lead_title`,`lead_sort_des`,`lead_mob_no`,`lead_alter_mob_no`,`lead_email`,`lead_business`,`lead_gender`,`lead_city`,`lead_state`,`lead_country`,`lead_source`,`lead_bkt_status`) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";
    await queryDb(q, [
      randomId,
      lead_cust_name,
      Number(lead_project_id),
      assignEmpId,
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

    // If an employee was assigned at creation, also record it in
    // claimed_interested_leads so it shows up as "claimed" for that employee
    // (same table used by employeeList/claimedListAdmin/basicClaimedLeadListAdmin)
    if (assignEmpId) {
      await queryDb(
        "INSERT INTO `claimed_interested_leads`(`clm_lead_id`,`clm_emp_id`,`clm_curr_status`) VALUES(?,?,?);",
        [Number(last_id?.[0]?.last_id), assignEmpId, 1]
      );
    }

    const getLeadSource = await queryDb(
      "SELECT `ld_src_name` FROM `lead_source` WHERE `ld_src_id` = ? LIMIT 1;",
      [Number(lead_source)]
    );
    const body = {
      type: "full",
      leadId: String(last_id?.[0]?.last_id),
      leadName: lead_cust_name,
      leadTitle: "Fresh Lead Arrived",
      leadSource: getLeadSource?.[0]?.ld_src_name,
    };
    await sendNotificationToEmp("", body);
    (await t)?.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    (await t)?.rollback();
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.employeeListForLeadCreation = async (req, res) => {
  try {
    const result = await queryDb(
      "SELECT `emp_id`,`emp_name` FROM `emp_registration_details` WHERE `emp_lgn_status` = 1;",
      []
    );
    return res.status(200).json(apiResponse(200, false, true, result, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

const normalizeExcelHeader = (h) =>
  String(h || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

const EXCEL_LEAD_COLUMN_MATCHERS = {
  name: (h) => h === "NAME",
  mobAlt: (h) => h.includes("MOB 2") || h.includes("MOB2") || h.includes("ALT"),
  mob: (h) => h === "MOB" || h === "MOBILE" || h === "MOBILE NO",
  email: (h) => h.includes("MAIL"),
  business: (h) => h.includes("BUSINESS"),
  gender: (h) => h.includes("GENDER"),
  city: (h) => h.includes("CITY"),
  state: (h) => h.includes("STATE"),
  country: (h) => h.includes("COUNTRY"),
  product: (h) => h.includes("PRODUCT") || h.includes("PRODCUT") || h.includes("PROJECT"),
  source: (h) => h.includes("SOURCE"),
  appointTo: (h) => h.includes("APPOINT"),
  remark: (h) => h.includes("REMARK") || h.includes("DESCRIPTION"),
};

const buildExcelLeadColumnMap = (sheetData) => {
  const headers = new Set();
  sheetData.forEach((row) => Object.keys(row).forEach((k) => headers.add(k)));
  const headerList = Array.from(headers);
  const findHeader = (matcher) =>
    headerList.find((h) => matcher(normalizeExcelHeader(h)));

  const map = {};
  for (const [field, matcher] of Object.entries(EXCEL_LEAD_COLUMN_MATCHERS)) {
    map[field] = findHeader(matcher);
  }
  return map;
};

exports.createLeadByAdminByExcel = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.files || !req.files.file) {
      return res
        .status(201)
        .json(
          apiResponse(
            201,
            true,
            false,
            [],
            "File not found in request, please upload a file"
          )
        );
    }

    const excelFile = req.files.file;
    const workbook = XLSX.read(excelFile.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const colMap = buildExcelLeadColumnMap(sheetData);

    const getLeadSource = await queryDb(
      "SELECT ld_src_id, ld_src_name FROM lead_source WHERE ld_src_status = 1;",
      []
    );
    const getProjectTitle = await queryDb(
      "SELECT `pro_id`,pro_title FROM `project_details` WHERE `pro_status` = 1;",
      []
    );
    const getEmployees = await queryDb(
      "SELECT `emp_id`,`emp_name` FROM `emp_registration_details` WHERE `emp_lgn_status` = 1;",
      []
    );

    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      const lead_cust_name = colMap.name ? row[colMap.name] : "";
      const lead_mob_no = colMap.mob ? String(row[colMap.mob] ?? "") : "";
      const lead_alter_mob_no = colMap.mobAlt
        ? String(row[colMap.mobAlt] ?? "")
        : "";
      const lead_email = colMap.email ? row[colMap.email] : "";
      const lead_business = colMap.business ? row[colMap.business] : "";
      const lead_gender = colMap.gender ? row[colMap.gender] : "";
      const lead_city = colMap.city ? row[colMap.city] : "";
      const lead_state = colMap.state ? row[colMap.state] : "";
      const lead_country = colMap.country ? row[colMap.country] : "";
      const lead_project_title = colMap.product ? row[colMap.product] : "";
      const lead_source = colMap.source ? row[colMap.source] : "";
      const lead_appoint_to = colMap.appointTo ? row[colMap.appointTo] : "";
      const lead_sort_des = colMap.remark ? row[colMap.remark] || "" : "";

      if (
        String(lead_mob_no)?.length !== 10 ||
        (lead_alter_mob_no && String(lead_alter_mob_no)?.length !== 10)
      ) {
        await t?.rollback();
        return res
          .status(201)
          .json(apiResponse(201, false, false, [], sww + ` Line No: ${i + 1}`));
      }
      if (
        !lead_cust_name ||
        !lead_business ||
        !lead_gender ||
        !lead_city ||
        !lead_state ||
        !lead_country
      ) {
        await t.rollback();
        return res
          .status(201)
          .json(
            apiResponse(
              201,
              true,
              false,
              [],
              `Name/Business/Gender/City/State/Country are mandatory. Missing at line ${
                i + 1
              }`
            )
          );
      }
      const lead_title = lead_project_title || "Testing";
      const isLeadSourceExist = getLeadSource.find(
        (item) =>
          item.ld_src_name?.toLowerCase() ===
          String(lead_source || "")?.trim()?.toLowerCase()
      );
      const isProjectExist = getProjectTitle.find(
        (item) =>
          item.pro_title?.toLowerCase() ===
          String(lead_project_title || "")?.trim()?.toLowerCase()
      );
      // "Appoint To" is mandatory in the Excel upload — every row must map to
      // an existing active employee by name.
      const isEmployeeExist = getEmployees.find(
        (item) =>
          item.emp_name?.toLowerCase() ===
          String(lead_appoint_to || "").trim().toLowerCase()
      );
      if (!isLeadSourceExist || !isProjectExist || !isEmployeeExist) {
        await t.rollback();
        return res
          .status(201)
          .json(
            apiResponse(
              201,
              true,
              false,
              [],
              `Invalid/missing lead source, product name or appoint-to employee name at line ${
                i + 1
              }`
            )
          );
      }

      const randomId = "LEAD" + randomStrNumeric(10);

      await queryDb(
        "INSERT INTO lead_basic_details (lead_unique_id, lead_cust_name, lead_project_id, lead_insert_emp_id, lead_title, lead_sort_des, lead_mob_no, lead_alter_mob_no, lead_email, lead_business, lead_gender, lead_city, lead_state, lead_country, lead_source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          randomId,
          lead_cust_name,
          isProjectExist.pro_id,
          isEmployeeExist ? isEmployeeExist.emp_id : null,
          lead_title,
          lead_sort_des,
          lead_mob_no,
          lead_alter_mob_no || "",
          lead_email || "",
          lead_business || "",
          lead_gender || "",
          lead_city || "",
          lead_state || "",
          lead_country || "",
          isLeadSourceExist.ld_src_id,
        ]
      );

      if (isEmployeeExist || i === sheetData.length - 1) {
        const last_id = await queryDb("SELECT LAST_INSERT_ID() AS last_id", []);
        if (isEmployeeExist) {
          await queryDb(
            "INSERT INTO `claimed_interested_leads`(`clm_lead_id`,`clm_emp_id`,`clm_curr_status`) VALUES(?,?,?);",
            [Number(last_id?.[0]?.last_id), isEmployeeExist.emp_id, 1]
          );
        }
        if (i === sheetData.length - 1) {
          const body = {
            type: "full",
            leadId: String(last_id?.[0]?.last_id) || "",
            leadName: lead_cust_name || "",
            leadTitle: "Fresh Lead Arrived",
            leadSource: lead_source || "",
          };
          await sendNotificationToEmp("", body);
        }
      }
    }
    await t.commit();
    return res
      .status(200)
      .json(apiResponse(200, false, true, [], "Data inserted successfully"));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};

exports.followupDetails = async (req, res) => {
  const userId = req.userId;
  const {
    follow_type = 1, // 1 for follow-up, 2 for face-to-face, 3 for site visit
    lead_id,
    add_note = "",
    schedule_date = "",
    meeting_mode = "",
    destination = "",
    duration = "",
    reminder = "",
    location = "",
  } = req.body;
  if (!lead_id)
    return res.status(201).json(apiResponse(201, false, false, [], etr));
  const t = await sequelize.transaction();

  try {
    const isOwnLead = await queryDb(
      "SELECT `clm_id` FROM `claimed_interested_leads` WHERE `clm_lead_id` = ? AND `clm_emp_id` = ? LIMIT 1;",
      [Number(lead_id), Number(userId)]
    );
    if (isOwnLead.length === 0) {
      await t.rollback();
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
    if (Number(follow_type) === 1) {
      // one for follow-up
      if (!add_note && !schedule_date) {
        await t.rollback();
        return res.status(201).json(apiResponse(201, false, false, [], pfod));
      }
      if (
        schedule_date &&
        dateTimeValidation("datetime", schedule_date) !== "true"
      ) {
        const msg = dateTimeValidation("datetime", schedule_date);
        await t.rollback();
        return res.status(201).json(apiResponse(201, false, false, [], msg));
      }
      const isAlreadyExitFollow = await queryDb(
        "select `fl_id` from `follow_up_leads` where `fl_lead_id` =? and `fl_emp_id` =?;",
        [Number(lead_id), Number(userId)]
      );
      // if (isAlreadyExitFollow?.length > 0) {
      //   await queryDb(
      //     "UPDATE follow_up_leads SET fl_schedule_on = ?, fl_make_note = ? WHERE fl_id = ?;",
      //     [Number(isAlreadyExitFollow?.[0]?.fl_id)]
      //   );
      // } else {
      await queryDb(
        "INSERT INTO `follow_up_leads`(`fl_lead_id`,`fl_schedule_on`,`fl_emp_id`,`fl_make_note`) VALUES(?,?,?,?);",
        [Number(lead_id), schedule_date, userId, add_note]
      );
      if (add_note) {
        await queryDb(
          "INSERT INTO `lead_notes`(`nt_emp_id`,`nt_lead_id`,nt_title,`nt_description`) VALUES(?,?,?,?);",
          [Number(userId), Number(lead_id), "Follow Up", add_note || ""]
        );
      }

      // }

      if (schedule_date !== "") {
        const ifExistSchedule = await queryDb(
          "SELECT `sch_id` FROM `schedule_job` WHERE `emp_id` =? AND `lead_id` = ?; ",
          [Number(userId), Number(lead_id)]
        );
        // if (ifExistSchedule?.length > 0) {
        //   await queryDb(
        //     "UPDATE schedule_job SET schedule_for = ?,sch_time = ?,title = ?,description = ?,mode = ? ,navigate_to = ? WHERE sch_id = ? ",
        //     [follow_type, schedule_date, "", "", "half", ""]
        //   );
        // } else {
        await queryDb(
          "INSERT INTO `schedule_job`(`emp_id`,`lead_id`,`schedule_for`,`sch_time`,`title`,`description`,`mode`,`navigate_to`) VALUES(?,?,?,?,?,?,?,?);",
          [
            Number(userId),
            Number(lead_id),
            follow_type,
            schedule_date,
            "",
            "",
            "half",
            "",
          ]
        );
        // }
        await ActivityLogsFuns(
          Number(userId),
          lead_id,
          2,
          "Follow Up Scheduled",
          "Lead Scheduled for Follow Up"
        );
        await scheduleTask();
      }
    } else if (Number(follow_type) === 2) {
      // 2 for falce to face
      if (!reminder || !schedule_date) {
        await t.rollback();
        return res
          .status(201)
          .json(
            apiResponse(
              201,
              false,
              false,
              [],
              "Please fill Reminder and date time"
            )
          );
      }

      if (schedule_date !== "") {
        const schedulingTime = await queryDb(
          "SELECT DATE_SUB(?, INTERVAL ? MINUTE) AS result;",
          [
            moment(schedule_date)?.format("YYYY-MM-DD HH:mm:ss"),
            Number(reminder),
          ]
        );
        const actualTime = schedulingTime?.[0]?.result;
        if (
          actualTime &&
          dateTimeValidation("datetime", actualTime) !== "true"
        ) {
          const msg = dateTimeValidation("datetime", actualTime);
          await t.rollback();
          return res.status(201).json(apiResponse(201, false, false, [], msg));
        }
        const ifExistSchedule = await queryDb(
          "SELECT `sch_id` FROM `schedule_job` WHERE `emp_id` =? AND `lead_id` = ?; ",
          [Number(userId), Number(lead_id)]
        );
        // if (ifExistSchedule?.length > 0) {
        //   await queryDb(
        //     "UPDATE schedule_job SET schedule_for = ?,sch_time = ?,title = ?,description = ?,mode = ? ,navigate_to = ? WHERE sch_id = ? ",
        //     [follow_type, schedule_date, "", "", "half", ""]
        //   );
        // } else {
        await queryDb(
          "INSERT INTO `schedule_job`(`emp_id`,`lead_id`,`schedule_for`,`sch_time`,`title`,`description`,`mode`,`navigate_to`) VALUES(?,?,?,?,?,?,?,?);",
          [
            Number(userId),
            Number(lead_id),
            follow_type,
            schedule_date,
            "",
            "",
            "half",
            "",
          ]
        );
        // }
        await ActivityLogsFuns(
          Number(userId),
          lead_id,
          2,
          "Face-to-face Scheduled",
          "Lead Scheduled for Face To Face"
        );
        await scheduleTask();
      }
      const isExistFaceToFace = await queryDb(
        "SELECT `fac_id` FROM `face_to_face` WHERE `fac_lead_id` = ? AND `fac_emp_id` = ?;",
        [Number(lead_id), Number(userId)]
      );
      // if (isExistFaceToFace?.length > 0) {
      //   await queryDb(
      //     "UPDATE face_to_face SET fac_schdule_date = ?,fac_meeting_mode = ?,fac_destination = ?,fac_duration = ?,fac_reminder = ?,fac_add_note = ? WHERE fac_id = ?",
      //     [Number(isExistFaceToFace?.[0]?.fac_id)]
      //   );
      // } else {
      await queryDb(
        "INSERT INTO `face_to_face`(`fac_lead_id`,`fac_emp_id`,`fac_schdule_date`,`fac_meeting_mode`,`fac_destination`,`fac_duration`,`fac_reminder`,`fac_add_note`) VALUES(?,?,?,?,?,?,?,?);",
        [
          Number(lead_id),
          Number(userId),
          schedule_date || "",
          meeting_mode || "",
          destination || "",
          duration || "",
          reminder || "",
          add_note || "",
        ]
      );
      if (add_note) {
        await queryDb(
          "INSERT INTO `lead_notes`(`nt_emp_id`,`nt_lead_id`,nt_title,`nt_description`) VALUES(?,?,?,?);",
          [Number(userId), Number(lead_id), "Face-to-face", add_note || ""]
        );
      }
      // }
    } else {
      // 3 for site visit
      // this is for ste visit only

      if (
        !add_note &&
        !schedule_date &&
        !meeting_mode &&
        !destination &&
        !duration &&
        !reminder &&
        !location
      ) {
        await t.rollback();
        return res.status(201).json(apiResponse(201, false, false, [], pfod));
      }

      if (schedule_date !== "") {
        const schedulingTime = await queryDb(
          "SELECT DATE_SUB(?, INTERVAL ? MINUTE) AS result;",
          [
            moment(schedule_date)?.format("YYYY-MM-DD HH:mm:ss"),
            Number(reminder),
          ]
        );
        const actualTime = schedulingTime?.[0]?.result;

        if (
          actualTime &&
          dateTimeValidation("datetime", actualTime) !== "true"
        ) {
          const msg = dateTimeValidation("datetime", actualTime);
          await t.rollback();
          return res.status(201).json(apiResponse(201, false, false, [], msg));
        }
        const ifExistSchedule = await queryDb(
          "SELECT `sch_id` FROM `schedule_job` WHERE `emp_id` =? AND `lead_id` = ?; ",
          [Number(userId), Number(lead_id)]
        );
        // if (ifExistSchedule?.length > 0) {
        //   await queryDb(
        //     "UPDATE schedule_job SET schedule_for = ?,sch_time = ?,title = ?,description = ?,mode = ? ,navigate_to = ? WHERE sch_id = ? ",
        //     [follow_type, schedule_date, "", "", "half", ""]
        //   );
        // } else {
        await queryDb(
          "INSERT INTO `schedule_job`(`emp_id`,`lead_id`,`schedule_for`,`sch_time`,`title`,`description`,`mode`,`navigate_to`) VALUES(?,?,?,?,?,?,?,?);",
          [
            Number(userId),
            Number(lead_id),
            follow_type,
            schedule_date,
            "",
            "",
            "half",
            "",
          ]
        );
        // }
        await ActivityLogsFuns(
          Number(userId),
          lead_id,
          2,
          "Site Visit Scheduled",
          "Lead Scheduled for Site Visit"
        );
        await scheduleTask();
      }
      // const ifExistSiteVisit = await queryDb(
      //   "SELECT `st_vst_id` FROM `site_visit` WHERE `st_vst_lead_id` = ? AND `st_vst_emp_id` = ?; ",
      //   [Number(lead_id), Number(userId)]
      // );
      // if (ifExistSiteVisit?.length > 0) {
      //   await queryDb(
      //     "UPDATE site_visit SET st_vst_schdule_date = ?,st_vst_meeting_mode = ?,st_vst_duration = ?,st_vst_reminder = ?,st_vst_add_note = ?,st_vst_location = ? WHERE st_vst_id = ? ;",
      //     [
      //       schedule_date || "",
      //       meeting_mode || "",
      //       duration || "",
      //       reminder || "",
      //       add_note || "",
      //       location || "",
      //     ]
      //   );
      // } else {
      await queryDb(
        "INSERT INTO `site_visit`(`st_vst_lead_id`,`st_vst_emp_id`,`st_vst_schdule_date`,`st_vst_meeting_mode`,`st_vst_duration`,`st_vst_reminder`,`st_vst_add_note`,st_vst_location) VALUES(?,?,?,?,?,?,?,?);",
        [
          Number(lead_id),
          Number(userId),
          schedule_date || "",
          meeting_mode || "",
          duration || "",
          reminder || "",
          add_note || "",
          location || "",
        ]
      );
      if (add_note) {
        await queryDb(
          "INSERT INTO `lead_notes`(`nt_emp_id`,`nt_lead_id`,nt_title,`nt_description`) VALUES(?,?,?,?);",
          [Number(userId), Number(lead_id), "Site Visit", add_note || ""]
        );
      }
      // }
    }
    await queryDb(
      "UPDATE `claimed_interested_leads` SET clm_curr_status =  CASE WHEN clm_curr_status = 2 THEN 3 ELSE clm_curr_status END  WHERE `clm_lead_id` = ? AND `clm_emp_id` = ?;",
      [Number(lead_id), Number(userId)]
    );
    await queryDb(
      "UPDATE `lead_basic_details` SET lead_bkt_status =  CASE WHEN lead_bkt_status = 2 THEN 3 ELSE lead_bkt_status END WHERE `lead_id` = ?;",
      [Number(lead_id)]
    );

    await t.commit();
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    (await t)?.rollback();
    console.log(e);
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.updateRatingDetails = async (req, res) => {
  const userId = req.userId;
  const { lead_id, rating } = req.body;
  if (!lead_id || !rating)
    // 1 Cold, 2 Hot, 3 Warm
    return res.status(200).json(apiResponse(201, false, false, [], etr));
  try {
    await queryDb(
      "UPDATE `lead_extended_info` SET `ex_lead_ratting_int` = ? WHERE `ex_lead_id` = ? AND `ex_emp_id` = ?;",
      [Number(rating), Number(lead_id), Number(userId)]
    );
    await ActivityLogsFuns(
      Number(userId),
      lead_id,
      1,
      "Rate to Lead",
      "Rate to lead done"
    );
    return res.status(200).json(apiResponse(200, false, true, [], dus));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], e.message + sr || sww));
  }
};
exports.notificationList = async (req, res) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
      notification_type = "ALL", // NEW, OLD, ALL
    } = req.body;

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `
      SELECT COUNT(*) AS cnt
      FROM schedule_job sj
      INNER JOIN lead_basic_details lbd ON sj.lead_id = lbd.lead_id
      WHERE sj.emp_id = ?
    `;

    let baseQuery = `
      SELECT sj.lead_id, sj.schedule_for, sj.sch_time,
             lbd.lead_unique_id, lbd.lead_title
      FROM schedule_job sj
      INNER JOIN lead_basic_details lbd ON sj.lead_id = lbd.lead_id
      WHERE sj.emp_id = ?
    `;

    const reP = [req.userId];
    const reB = [req.userId];

    if (start_date && end_date) {
      countQuery +=
        " AND DATE(sj.created_at) >= ? AND DATE(sj.created_at) <= ? ";
      baseQuery +=
        " AND DATE(sj.created_at) >= ? AND DATE(sj.created_at) <= ? ";
      const start = moment(start_date).format("YYYY-MM-DD");
      const end = moment(end_date).format("YYYY-MM-DD");
      reP.push(start, end);
      reB.push(start, end);
    }

    if (search) {
      countQuery += " AND lbd.lead_title LIKE ? ";
      baseQuery += " AND lbd.lead_title LIKE ? ";
      const searchTerm = `%${search}%`;
      reP.push(searchTerm);
      reB.push(searchTerm);
    }

    if (notification_type !== "ALL") {
      const status = notification_type === "OLD" ? 2 : 1;
      countQuery += " AND sj.isProcessed = ? ";
      baseQuery += " AND sj.isProcessed = ? ";
      reP.push(status);
      reB.push(status);
    }

    baseQuery += " ORDER BY sj.sch_id DESC LIMIT ? OFFSET ? ";
    reB.push(pageSize, offset);

    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt || 0);

    const result = await queryDb(baseQuery, reB);

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        dgs // assumed constant
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Internal Server Error")
      );
  }
};
exports.addLeadMoreInfo = async (req, res) => {
  const userId = req.userId;
  const {
    lead_id,
    ex_mobile,
    ex_alternate_mob,
    ex_email,
    ex_additional_info,
    ex_interested_property_type_id,
    ex_lead_budget_id = 0,
    ex_mod_of_transport_id = 0,
    ex_stay_duration,
    ex_preferred_size = 0,
    ex_preferred_floor = 0,
    ex_possession_id = 0,
    ex_purpose_of_buy = 0,
    ex_payment_id = 0,
    ex_loan_details_share,
    ex_does_loan_need_sanctioned_first,
    ex_expected_buy_time,
    ex_interested_in_commercial_purpose,
    ex_have_old_existing_pro_for_sell,
    ex_expected_down_payment,
    ex_lead_ratting_int,
    ex_vastu_preference,
    ex_add_note,
    ex_project_id,
    ex_phase_id,
  } = req.body;
  //sushma
  const getValidInt = (val, fallback) =>
    val === "" || val === undefined || isNaN(Number(val))
      ? fallback
      : Number(val);

  if (!lead_id)
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "lead_id is required"));
  if (!ex_project_id)
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "ex_project_id is required"));
  if (!ex_phase_id)
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "ex_phase_id is required"));

  const t = await sequelize.transaction();

  try {
    const [existing] = await queryDb(
      "SELECT * FROM lead_extended_info WHERE ex_lead_id = ? AND ex_emp_id = ? LIMIT 1",
      [lead_id, userId]
    );

    if (!existing)
      return res
        .status(404)
        .json(apiResponse(404, false, false, [], "Lead info not found"));

    const values = {
      ex_mobile: ex_mobile ?? existing.ex_mobile,
      ex_alternate_mob: ex_alternate_mob ?? existing.ex_alternate_mob,
      ex_email: ex_email ?? existing.ex_email,
      ex_additional_info: ex_additional_info ?? existing.ex_additional_info,
      ex_interested_property_type_id: ex_interested_property_type_id
        ? Number(ex_interested_property_type_id)
        : existing.ex_interested_property_type_id,
      ex_lead_budget_id: ex_lead_budget_id
        ? Number(ex_lead_budget_id)
        : existing.ex_lead_budget_id,
      ex_mod_of_transport_id: ex_mod_of_transport_id
        ? Number(ex_mod_of_transport_id)
        : existing.ex_mod_of_transport_id,
      ex_stay_duration: ex_stay_duration ?? existing.ex_stay_duration,
      ex_preferred_size: ex_preferred_size ?? existing.ex_preferred_size,
      ex_preferred_floor: getValidInt(
        ex_preferred_floor,
        existing.ex_preferred_floor
      ),
      // ex_preferred_floor: ex_preferred_floor ?? existing.ex_preferred_floor,
      ex_possession_id: ex_possession_id
        ? Number(ex_possession_id)
        : existing.ex_possession_id,
      ex_purpose_of_buy: ex_purpose_of_buy ?? existing.ex_purpose_of_buy,
      ex_payment_id: ex_payment_id
        ? Number(ex_payment_id)
        : existing.ex_payment_id,
      ex_loan_details_share:
        ex_loan_details_share ?? existing.ex_loan_details_share,
      ex_does_loan_need_sanctioned_first:
        ex_does_loan_need_sanctioned_first ??
        existing.ex_does_loan_need_sanctioned_first,
      ex_expected_buy_time:
        ex_expected_buy_time ?? existing.ex_expected_buy_time,
      ex_interested_in_commercial_purpose:
        ex_interested_in_commercial_purpose ??
        existing.ex_interested_in_commercial_purpose,
      ex_have_old_existing_pro_for_sell:
        ex_have_old_existing_pro_for_sell ??
        existing.ex_have_old_existing_pro_for_sell,
      ex_expected_down_payment:
        ex_expected_down_payment ?? existing.ex_expected_down_payment,
      ex_lead_ratting_int: ex_lead_ratting_int
        ? Number(ex_lead_ratting_int)
        : existing.ex_lead_ratting_int,
      ex_vastu_preference: ex_vastu_preference ?? existing.ex_vastu_preference,
      ex_add_note: ex_add_note ?? existing.ex_add_note,
    };

    const setString = Object.keys(values)
      .map((k) => `${k} = ?`)
      .join(", ");
    const updateValues = [...Object.values(values), lead_id, userId];

    const q = `UPDATE lead_extended_info SET ${setString} WHERE ex_lead_id = ? AND ex_emp_id = ?`;

    await queryDb(q, updateValues);
    await ActivityLogsFuns(
      Number(userId),
      lead_id,
      1,
      "Update Lead Details",
      "Update Lead Details"
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
exports.getLeadDetailsById = async (req, res) => {
  const userId = req.userId;
  const { lead_id } = req.query;
  if (!lead_id)
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "lead_id required"));
  try {
    const data = await queryDb(
      `SELECT * FROM lead_details_by_lead_id WHERE ex_lead_id = ? AND ex_emp_id = ?`,
      [lead_id, userId]
    );
    return res.status(200).json(apiResponse(200, false, true, data, ndf));
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.addProjectDetails = async (req, res) => {
  const { pro_title, pro_sort_description, pro_full_description } = req.body;
  const file = req.files?.file; // assuming form field name is 'file'
  if (!pro_title && !pro_full_description && !pro_sort_description && !file) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Project details are required"));
  }
  let filePath = "";
  try {
    // Handle file upload
    if (file) {
      filePath = ensureUpload(file, "admin_docs");
    }
    console.log(filePath);
    const randomProId = "PRO" + randomStrAlphabetNumeric(10);
    await queryDb(
      "INSERT INTO `project_details`(pro_unique_id,`pro_title`, `pro_sort_description`, `pro_full_description`, `pro_image`) VALUES (?,?, ?, ?, ?);",
      [
        randomProId,
        pro_title || "",
        pro_sort_description || "",
        pro_full_description || "",
        filePath,
      ]
    );
    return res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.updateProjectDetails = async (req, res) => {
  const { pro_id, pro_title, pro_sort_description, pro_full_description } =
    req.body;
  const file = req.files?.file;
  if (!pro_id) {
    return res
      .status(201)
      .json(apiResponse(201, true, false, [], "Project ID is required"));
  }

  try {
    // Fetch existing record
    const existing = await queryDb(
      "SELECT * FROM `project_details` WHERE pro_id = ?",
      [pro_id]
    );

    if (!existing) {
      return res
        .status(404)
        .json(apiResponse(404, true, false, [], "Project not found"));
    }

    // Handle file upload if provided
    let filePath = "";
    if (file) {
      filePath = await ensureUpload(file, "admin_docs");
    }
    // Prepare updated values (fallback to existing if not provided)
    const updatedTitle = pro_title ?? existing?.[0]?.pro_title;
    const updatedSortDesc =
      pro_sort_description ?? existing?.[0].pro_sort_description;
    const updatedFullDesc =
      pro_full_description ?? existing?.[0].pro_full_description;
    filePath = filePath === "" ? existing?.[0].pro_image : filePath;
    // Update query
    await queryDb(
      `UPDATE project_details 
       SET pro_title = ?, pro_sort_description = ?, pro_full_description = ?, pro_image = ? 
       WHERE pro_id = ?`,
      [updatedTitle, updatedSortDesc, updatedFullDesc, filePath, Number(pro_id)]
    );

    return res
      .status(200)
      .json(apiResponse(200, false, true, [], "Project updated successfully"));
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};

exports.addPhaseDetails = async (req, res) => {
  const {
    phase_project_id = "",
    phase_direction = "", // link
    phase_website = "", // link
    phase_description = "", // string
    phase_title = "",
  } = req.body;
  const phase_floor_plans = req.files?.phase_floor_plans; // pdf
  const phase_brouchure = req.files?.phase_brouchure; // pdf
  const phase_details = req.files?.phase_details; // pdf
  if (!phase_project_id || !phase_title) {
    return res
      .status(201)
      .json(
        apiResponse(
          201,
          false,
          false,
          [],
          "phase_project_id and  phase_title is required"
        )
      );
  }
  if (
    !phase_direction &&
    !phase_details &&
    !phase_website &&
    !phase_floor_plans &&
    !phase_brouchure &&
    !phase_description
  ) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Phase details are required"));
  }

  const isPdf = (file) => file.mimetype === "application/pdf";

  let phase_floor_plans_path = "";
  let phase_brouchure_path = "";
  let phase_details_path = "";

  let t;
  try {
    t = await sequelize.transaction();

    if (phase_floor_plans) {
      if (!isPdf(phase_floor_plans)) {
        await t.rollback();
        return res
          .status(201)
          .json(
            apiResponse(201, true, false, [], "Floor plans must be a PDF file")
          );
      }
      phase_floor_plans_path = await ensureUpload(
        phase_floor_plans,
        "admin_docs"
      );
    }

    if (phase_brouchure) {
      if (!isPdf(phase_brouchure)) {
        await t.rollback();
        return res
          .status(201)
          .json(
            apiResponse(201, true, false, [], "Brochure must be a PDF file")
          );
      }

      phase_brouchure_path = await ensureUpload(phase_brouchure, "admin_docs");
    }

    if (phase_details) {
      if (!isPdf(phase_details)) {
        await t.rollback();
        return res
          .status(201)
          .json(
            apiResponse(
              201,
              true,
              false,
              [],
              "Phase details must be a PDF file"
            )
          );
      }

      phase_details_path = await ensureUpload(phase_details, "admin_docs");
    }

    await queryDb(
      "INSERT INTO `phase_details`(`phase_project_id`,phase_title, `phase_direction`, `phase_details`, `phase_website`, `phase_floor_plans`, `phase_brouchure`, `phase_description`) VALUES (?,?, ?, ?, ?, ?, ?, ?);",
      [
        Number(phase_project_id),
        phase_title,
        phase_direction,
        phase_details_path,
        phase_website,
        phase_floor_plans_path,
        phase_brouchure_path,
        phase_description,
      ]
    );

    await t.commit();
    return res
      .status(200)
      .json(
        apiResponse(200, false, true, [], "Phase details added successfully")
      );
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.updatePhaseDetails = async (req, res) => {
  const {
    phase_id,
    phase_project_id,
    phase_direction,
    phase_website,
    phase_description,
  } = req.body;

  const phase_floor_plans = req.files?.phase_floor_plans; // pdf
  const phase_brouchure = req.files?.phase_brouchure; // pdf
  const phase_details = req.files?.phase_details; // pdf

  if (!phase_id) {
    return res
      .status(201)
      .json(apiResponse(201, true, false, [], "Phase ID is required"));
  }

  const isPdf = (file) => file.mimetype === "application/pdf";

  let t;
  try {
    t = await sequelize.transaction();

    // Get existing data
    const [existing] = await queryDb(
      "SELECT * FROM `phase_details` WHERE phase_id = ?",
      [phase_id]
    );

    if (!existing) {
      await t.rollback();
      return res
        .status(404)
        .json(apiResponse(404, true, false, [], "Phase not found"));
    }

    let phase_floor_plans_path = existing.phase_floor_plans;
    let phase_brouchure_path = existing.phase_brouchure;
    let phase_details_path = existing.phase_details;

    if (phase_floor_plans) {
      if (!isPdf(phase_floor_plans)) {
        await t.rollback();
        return res
          .status(201)
          .json(apiResponse(201, true, false, [], "Floor plans must be a PDF"));
      }

      phase_floor_plans_path = ensureUpload(phase_floor_plans, "admin_docs");
    }

    if (phase_brouchure) {
      if (!isPdf(phase_brouchure)) {
        await t.rollback();
        return res
          .status(201)
          .json(apiResponse(201, true, false, [], "Brochure must be a PDF"));
      }

      phase_brouchure_path = ensureUpload(phase_brouchure, "admin_docs");
    }

    if (phase_details) {
      if (!isPdf(phase_details)) {
        await t.rollback();
        return res
          .status(201)
          .json(apiResponse(201, true, false, [], "Details must be a PDF"));
      }

      phase_details_path = ensureUpload(phase_details, "admin_docs");
    }

    // Update query using fallback to old values
    await queryDb(
      `UPDATE phase_details SET 
        phase_project_id = ?, 
        phase_direction = ?, 
        phase_details = ?, 
        phase_website = ?, 
        phase_floor_plans = ?, 
        phase_brouchure = ?, 
        phase_description = ?
      WHERE phase_id = ?`,
      [
        phase_project_id ?? existing.phase_project_id,
        phase_direction ?? existing.phase_direction,
        phase_details_path || "",
        phase_website ?? existing.phase_website,
        phase_floor_plans_path || "",
        phase_brouchure_path || "",
        phase_description ?? existing.phase_description,
        phase_id,
      ]
    );

    await t.commit();
    return res
      .status(200)
      .json(
        apiResponse(200, false, true, [], "Phase details updated successfully")
      );
  } catch (e) {
    await t.rollback();
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};

exports.getProjectPhaseDetailsById = async (req, res) => {
  const { project_id } = req.query;

  try {
    let re = [];
    let q = `
     SELECT 
  JSON_OBJECT(
    'pro_id', pro_id,
    'pro_title', pro_title,
    'pro_sort_description', pro_sort_description,
    'pro_full_description', pro_full_description,
    'pro_image', pro_image,
    'created_at',created_at
  ) AS project_details,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'phase_id',phase_id,
      'phase_title',phase_title,
      'phase_status',phase_status,
      'phase_project_id', phase_project_id,
      'phase_direction',phase_direction,
      'phase_details',phase_details,
      'phase_website',phase_website,
      'phase_floor_plans',phase_floor_plans,
      'phase_brouchure',phase_brouchure,
      'phase_description',phase_description,
      'phase_created_at',phase_created_at
    )
  ) AS phase_details
  FROM project_details 
  LEFT JOIN phase_details ON phase_project_id = pro_id 

     `;
    if (project_id && project_id !== "") {
      q += " WHERE pro_id = ? GROUP BY pro_id;";
      re.push(Number(project_id));
    } else {
      q += " GROUP BY pro_id;";
    }
    const data = await queryDb(q, re);
    return res.status(200).json(apiResponse(200, false, true, data, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(
        apiResponse(500, true, false, [], e.message || "Something went wrong")
      );
  }
};
exports.getProjectList = async (req, res) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
    } = req.body;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let countQuery = `SELECT COUNT(*) AS cnt FROM project_details `;
    let baseQuery = `SELECT *,(SELECT COUNT(*) FROM phase_details WHERE phase_project_id = pro_id GROUP BY phase_project_id) AS total_phase FROM project_details `;
    let reP = [];
    let reB = [];
    if (start_date && end_date) {
      countQuery += "WHERE  DATE(created_at) >= ? AND DATE(created_at) <= ? ";
      baseQuery += " WHERE DATE(created_at) >= ? AND DATE(created_at) <= ? ";
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
        " WHERE (pro_title LIKE ? OR pro_sort_description LIKE ? OR pro_full_description LIKE ?) ";
      baseQuery +=
        " WHERE (pro_title LIKE ? OR pro_full_description LIKE ? OR pro_sort_description LIKE ?) ";
      reP.push(`%${search}%`, `%${search}%`, `%${search}%`);
      reB.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    baseQuery += " ORDER BY `pro_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
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
exports.updatePhaseStatus = async (req, res) => {
  const { phase_id } = req.query;
  try {
    if (!phase_id)
      return res
        .status(400)
        .json(apiResponse(true, false, [], "Phase ID is required."));
    await queryDb(
      "update `phase_details` set phase_status = case when `phase_status` = 1 then 2 else 1 end where `phase_id` = ?;",
      [Number(phase_id)]
    );
    return res.status(200).json(apiResponse(200, false, true, [], dus));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};
exports.proJectListDropDown = async (req, res) => {
  try {
    const response = await queryDb(
      "SELECT `pro_id`,`pro_unique_id`,`pro_title` FROM `project_details` WHERE `pro_status` = 1;",
      []
    );
    return res.status(200).json(apiResponse(200, false, true, response, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

// Powers the status tabs on "Basic Lead" — that page only lists ASSIGNED leads
// (see basicLeadList), so its tile counts must be scoped the same way, unlike
// getAdminDashboardBucketCount below (which counts all leads, for the Dashboard).
exports.getBasicLeadBucketCount = async (req, res) => {
  try {
    let bucketResult = await queryDb(
      `SELECT ld_bkt_status, COUNT(*) as cnt
       FROM lead_basic_details
       INNER JOIN lead_bucket_status ON ld_bkt_id = lead_bkt_status
       WHERE EXISTS (SELECT 1 FROM claimed_interested_leads c INNER JOIN emp_registration_details e ON e.emp_id = c.clm_emp_id WHERE c.clm_lead_id = lead_id)
       GROUP BY lead_bkt_status;`,
      []
    );
    bucketResult?.push({
      ld_bkt_status: "Total Leads",
      cnt: bucketResult?.reduce((a, b) => a + Number(b?.cnt || 0), 0),
    });
    const freshResult = await queryDb(
      `SELECT COUNT(*) as cnt
       FROM lead_basic_details lb
       WHERE EXISTS (SELECT 1 FROM claimed_interested_leads c INNER JOIN emp_registration_details e ON e.emp_id = c.clm_emp_id WHERE c.clm_lead_id = lb.lead_id)
       AND NOT EXISTS (SELECT 1 FROM lead_followups WHERE follow_lead_id = lb.lead_id);`,
      []
    );
    bucketResult?.push({
      ld_bkt_status: "Fresh",
      cnt: freshResult?.[0]?.cnt || 0,
    });
    return res
      .status(200)
      .json(
        apiResponse(
          200,
          false,
          true,
          bucketResult,
          "Counts fetched successfully"
        )
      );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || `Internal Server Error`));
  }
};

// Counts for the follow-up-type filter row (Calling / Site Visit Done /
// Office Meeting Done / BOP Done / Home BOP Done) — how many assigned leads'
// LATEST follow-up is of each type. Independent of the lead_type (Hot/Cold/
// etc.) bucket counts above — leads with no follow-up yet simply aren't
// counted here (they show up under the "Fresh" lead_type bucket instead).
exports.getFollowupTypeBucketCount = async (req, res) => {
  try {
    const bucketResult = await queryDb(
      `SELECT lf.follow_type, COUNT(*) AS cnt
       FROM lead_basic_details lb
       INNER JOIN lead_followups lf ON lf.follow_id = (
         SELECT MAX(follow_id) FROM lead_followups WHERE follow_lead_id = lb.lead_id
       )
       WHERE EXISTS (SELECT 1 FROM claimed_interested_leads c INNER JOIN emp_registration_details e ON e.emp_id = c.clm_emp_id WHERE c.clm_lead_id = lb.lead_id)
       GROUP BY lf.follow_type;`,
      []
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

exports.getAdminDashboardBucketCount = async (req, res) => {
  try {
    let bucketResult = await queryDb(
      "SELECT `ld_bkt_status`,COUNT(*) as cnt FROM `lead_basic_details` INNER JOIN `lead_bucket_status` ON `ld_bkt_id` = `lead_bkt_status` GROUP BY `lead_bkt_status`;",
      []
    );
    bucketResult?.push({
      ld_bkt_status: "Total Leads",
      cnt: bucketResult?.reduce((a, b) => a + Number(b?.cnt || 0), 0),
    });
    return res
      .status(200)
      .json(
        apiResponse(
          200,
          false,
          true,
          bucketResult,
          "Counts fetched successfully"
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], "Error fetching lead counts"));
  }
};

exports.leadProfile = async (req, res) => {
  const { lead_id } = req.query;
  if (!lead_id)
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Lead is is required."));
  try {
    // `lead_profile` (a VIEW) used to join `leads_total_fol_face_site` directly, but that
    // view does GROUP BY + JSON_ARRAYAGG over follow_up_leads/face_to_face/site_visit —
    // MySQL can't push a WHERE lead_id=? predicate into a GROUP BY view when it's used as
    // a JOIN target, so it was materializing that aggregation for all 104k leads on every
    // single profile load (15+ seconds). Query lead_profile's other joins directly here
    // (fast, ~40ms) and fetch the follow-up/face-to-face/site-visit rollup separately.
    const [response, folFaceSiteRows] = await Promise.all([
      queryDb(
        `SELECT
          lead_basic_details.lead_id AS lead_id,
          lead_basic_details.lead_unique_id AS lead_unique_id,
          lead_basic_details.lead_cust_name AS lead_cust_name,
          lead_basic_details.lead_project_id AS lead_project_id,
          lead_basic_details.lead_title AS lead_title,
          lead_basic_details.lead_sort_des AS lead_sort_des,
          lead_basic_details.lead_mob_no AS lead_mob_no,
          lead_basic_details.lead_alter_mob_no AS lead_alter_mob_no,
          lead_basic_details.lead_email AS lead_email,
          lead_basic_details.lead_meeting_staus AS lead_meeting_staus,
          lead_basic_details.lead_inserted_by AS lead_inserted_by,
          lead_basic_details.lead_created_at AS lead_created_at,
          lead_bucket_status.ld_bkt_status AS ld_bkt_status,
          lead_contact_method.ld_cont_name AS ld_cont_name,
          lead_source.ld_src_name AS ld_src_name,
          JSON_OBJECT('emp_lgn_id', emp_inserted.emp_lgn_id, 'emp_unique_id', emp_inserted.emp_unique_id, 'emp_name', emp_inserted.emp_name, 'emp_mobile', emp_inserted.emp_mobile, 'emp_email', emp_inserted.emp_email, 'emp_pass', emp_inserted.emp_pass, 'emp_address', emp_inserted.emp_address) AS created_by,
          JSON_OBJECT('pro_id', project_details.pro_id, 'pro_unique_id', project_details.pro_unique_id, 'pro_title', project_details.pro_title, 'pro_sort_description', project_details.pro_sort_description, 'pro_full_description', project_details.pro_full_description, 'pro_image', project_details.pro_image, 'created_at', project_details.created_at, 'phase_detailsss', JSON_OBJECT('phase_id', phase_details.phase_id, 'phase_project_id', phase_details.phase_project_id, 'phase_direction', phase_details.phase_direction, 'phase_details', phase_details.phase_details, 'phase_website', phase_details.phase_website, 'phase_floor_plans', phase_details.phase_floor_plans, 'phase_brouchure', phase_details.phase_brouchure, 'phase_description', phase_details.phase_description, 'phase_created_at', phase_details.phase_created_at)) AS project_details,
          JSON_OBJECT('\`ex_mobile\`', lead_extended_info.ex_mobile, '\`ex_alternate_mob\`', lead_extended_info.ex_alternate_mob, '\`ex_email\`', lead_extended_info.ex_email, '\`ex_additional_info\`', lead_extended_info.ex_additional_info, '\`ex_interested_property_type_id\`', JSON_OBJECT('\`prop_title\`', property_type.prop_title, '\`prop_slug\`', property_type.prop_slug), '\`ex_lead_budget_id\`', JSON_OBJECT('\`bud_title\`', budget_list.bud_title, '\`bud_slug\`', budget_list.bud_slug), '\`ex_mod_of_transport_id\`', JSON_OBJECT('\`tr_md_title\`', transport_mode.tr_md_title, '\`tr_md_slug\`', transport_mode.tr_md_slug), '\`ex_stay_duration\`', lead_extended_info.ex_stay_duration, '\`ex_preferred_size\`', lead_extended_info.ex_preferred_size, '\`ex_preferred_floor\`', lead_extended_info.ex_preferred_floor, '\`ex_possession_id\`', JSON_OBJECT('\`poss_title\`', possession_list.poss_title, '\`poss_duration\`', possession_list.poss_duration, '\`poss_description\`', possession_list.poss_description), '\`ex_purpose_of_buy\`', lead_extended_info.ex_purpose_of_buy, '\`ex_payment_id\`', JSON_OBJECT('\`pay_md_title\`', payment_mode.pay_md_title, '\`pay_md_slug\`', payment_mode.pay_md_slug, '\`pay_md_description\`', payment_mode.pay_md_description), '\`ex_loan_details_share\`', lead_extended_info.ex_loan_details_share, '\`ex_does_loan_need_sanctioned_first\`', lead_extended_info.ex_does_loan_need_sanctioned_first, '\`ex_expected_buy_time\`', lead_extended_info.ex_expected_buy_time, '\`ex_interested_in_commercial_purpose\`', lead_extended_info.ex_interested_in_commercial_purpose, '\`ex_have_old_existing_pro_for_sell\`', lead_extended_info.ex_have_old_existing_pro_for_sell, '\`ex_expected_down_payment\`', lead_extended_info.ex_expected_down_payment, '\`ex_lead_ratting_int\`', lead_extended_info.ex_lead_ratting_int, '\`ex_vastu_preference\`', lead_extended_info.ex_vastu_preference, '\`ex_add_note\`', lead_extended_info.ex_add_note, '\`ex_created_at\`', lead_extended_info.ex_created_at) AS extended_details,
          JSON_OBJECT('emp_lgn_id', emp_claimed.emp_lgn_id, 'emp_unique_id', emp_claimed.emp_unique_id, 'emp_name', emp_claimed.emp_name, 'emp_mobile', emp_claimed.emp_mobile, 'emp_email', emp_claimed.emp_email, 'emp_pass', emp_claimed.emp_pass, 'emp_address', emp_claimed.emp_address) AS claimed_by,
          JSON_OBJECT('cp_id', channel_partner_profile.cp_id, 'cp_unique_id', channel_partner_profile.cp_unique_id, 'cp_name', channel_partner_profile.cp_name, 'cp_mobile_no', channel_partner_profile.cp_mobile_no, 'cp_email', channel_partner_profile.cp_email, 'cp_operation_localities', channel_partner_profile.cp_operation_localities, 'cp_firm_name', channel_partner_profile.cp_firm_name, 'cp_created_at', channel_partner_profile.cp_created_at, 'created_by', channel_partner_profile.created_by) AS channel_partner_details,
          JSON_OBJECT('fal_lead_id', lead_failure_reasons.fal_lead_id, 'fal_emp_id', lead_failure_reasons.fal_emp_id, 'fal_reason', lead_failure_reasons.fal_reason, 'fal_add_notes', lead_failure_reasons.fal_add_notes, 'fal_lead_status', lead_failure_reasons.fal_lead_status, 'fal_is_active', lead_failure_reasons.fal_is_active, 'fal_created_at', lead_failure_reasons.fal_created_at) AS failure_reasons
        FROM lead_basic_details
        LEFT JOIN lead_contact_method ON lead_contact_method.ld_cont_id = lead_basic_details.lead_contact_meth
        LEFT JOIN lead_source ON lead_basic_details.lead_source = lead_source.ld_src_id
        LEFT JOIN lead_bucket_status ON lead_bucket_status.ld_bkt_id = lead_basic_details.lead_bkt_status
        LEFT JOIN emp_registration_details emp_inserted ON emp_inserted.emp_id = lead_basic_details.lead_insert_emp_id
        LEFT JOIN project_details ON project_details.pro_id = lead_basic_details.lead_project_id
        LEFT JOIN lead_extended_info ON lead_extended_info.ex_lead_id = lead_basic_details.lead_id
        LEFT JOIN phase_details ON phase_details.phase_id = lead_extended_info.ex_phase_id
        LEFT JOIN property_type ON property_type.prop_id = lead_extended_info.ex_interested_property_type_id
        LEFT JOIN budget_list ON budget_list.bud_id = lead_extended_info.ex_lead_budget_id
        LEFT JOIN transport_mode ON transport_mode.tr_md_id = lead_extended_info.ex_mod_of_transport_id
        LEFT JOIN possession_list ON possession_list.poss_id = lead_extended_info.ex_possession_id
        LEFT JOIN payment_mode ON payment_mode.pay_md_id = lead_extended_info.ex_payment_id
        LEFT JOIN claimed_interested_leads ON claimed_interested_leads.clm_lead_id = lead_basic_details.lead_id
        LEFT JOIN emp_registration_details emp_claimed ON emp_claimed.emp_id = claimed_interested_leads.clm_emp_id
        LEFT JOIN channel_partner_profile ON channel_partner_profile.cp_id = lead_basic_details.lead_cp_id
        LEFT JOIN lead_failure_reasons ON lead_failure_reasons.fal_lead_id = lead_basic_details.lead_id
        WHERE lead_basic_details.lead_id = ?;`,
        [Number(lead_id)]
      ),
      queryDb(`SELECT * FROM leads_total_fol_face_site WHERE lead_id = ?;`, [
        Number(lead_id),
      ]),
    ]);

    const folFaceSite = folFaceSiteRows?.[0];
    const responseWithFolFaceSite = response.map((row) => ({
      ...row,
      fol_face_site_details: folFaceSite
        ? {
            lead_id: folFaceSite.lead_id,
            total_follow_up_cnt: folFaceSite.total_follow_up_cnt,
            follow_details: folFaceSite.follow_details,
            total_face_cnt: folFaceSite.total_face_cnt,
            face_to_face_details: folFaceSite.face_to_face_details,
            total_site_visit_cnt: folFaceSite.total_site_visit_cnt,
            site_visit_details: folFaceSite.site_visit_details,
          }
        : null,
    }));

    return res
      .status(200)
      .json(
        apiResponse(
          200,
          false,
          true,
          responseWithFolFaceSite,
          "Counts fetched successfully"
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], "Error fetching lead counts"));
  }
};
exports.empProfileDetails = async (req, res) => {
  const { emp_id } = req.query;
  if (!emp_id)
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "emp_id is is required."));
  try {
    // Run as separate (fast) queries and merge in JS. Query emp_registration_details
    // (the real, indexed table) instead of the emp_profile VIEW — emp_profile has a
    // slow subquery baked into its definition that made even a single-row lookup
    // take 70-100+ seconds on this DB.
    const [empRows, bucketRows, outDatedRows] = await Promise.all([
      queryDb("SELECT * FROM emp_registration_details WHERE emp_id = ?;", [
        Number(emp_id),
      ]),
      queryDb(
        `SELECT
          SUM(CASE WHEN lead_bkt_status = 1 THEN 1 ELSE 0 END) AS new_cnt,
          SUM(CASE WHEN lead_bkt_status = 2 THEN 1 ELSE 0 END) AS cold_cnt,
          SUM(CASE WHEN lead_bkt_status = 3 THEN 1 ELSE 0 END) AS warm_cnt,
          SUM(CASE WHEN lead_bkt_status = 6 THEN 1 ELSE 0 END) AS hot_cnt,
          SUM(CASE WHEN lead_bkt_status = 4 THEN 1 ELSE 0 END) AS close_cnt,
          SUM(CASE WHEN lead_bkt_status = 5 THEN 1 ELSE 0 END) AS convert_cnt
        FROM claimed_interested_leads
        INNER JOIN lead_basic_details ON lead_basic_details.lead_id = claimed_interested_leads.clm_lead_id
        WHERE clm_emp_id = ?;`,
        [Number(emp_id)]
      ),
      queryDb(
        `SELECT COUNT(*) AS out_dated_evnt_cnt
        FROM schedule_job
        INNER JOIN lead_basic_details ON lead_basic_details.lead_id = schedule_job.lead_id
        WHERE sch_time IS NOT NULL AND DATE(sch_time) > DATE(NOW())
          AND schedule_job.emp_id = ? AND lead_meeting_staus = 'NO';`,
        [Number(emp_id)]
      ),
    ]);

    const bc = bucketRows?.[0] || {};
    const response = empRows.map((row) => ({
      ...row,
      bucket_count: {
        new_cnt: Number(bc.new_cnt) || 0,
        cold_cnt: Number(bc.cold_cnt) || 0,
        warm_cnt: Number(bc.warm_cnt) || 0,
        hot_cnt: Number(bc.hot_cnt) || 0,
        close_cnt: Number(bc.close_cnt) || 0,
        convert_cnt: Number(bc.convert_cnt) || 0,
        out_dated_evnt_cnt: Number(outDatedRows?.[0]?.out_dated_evnt_cnt) || 0,
        ignored_cnt: 0,
      },
    }));

    return res
      .status(200)
      .json(
        apiResponse(200, false, true, response, "Counts fetched successfully")
      );
  } catch (error) {
    return res
      .status(500)
      .json(apiResponse(500, true, false, [], "Error fetching lead counts"));
  }
};
exports.addFailedTitleWithReasons = async (req, res) => {
  const { fail_title, reasons } = req.body;
  if (!fail_title || !Array.isArray(reasons) || reasons.length === 0) {
    return res.status(400).json(apiResponse(201, false, false, [], etr));
  }
  const fail_slug = fail_title.toLowerCase().replace(/\s+/g, "_");
  try {
    const query =
      "INSERT INTO lead_failure_reasons_dropdown (fail_title, fail_slug) VALUES (?, ?)";
    const values = [fail_title, fail_slug];
    await queryDb(query, values);
    const fail_id = await queryDb("SELECT LAST_INSERT_ID() AS last_id", []);
    if (reasons.length > 0) {
      const subReasonQuery = `INSERT INTO lead_failure_sub_reasons_dropdown (fl_s_fail_id, fl_s_title, fl_s_slug) VALUES ? `;
      const subReasonValues = reasons.map((reason) => [
        fail_id?.[0]?.last_id,
        reason,
        reason.toLowerCase().replace(/\s+/g, "_"),
      ]);
      await queryDb(subReasonQuery, [subReasonValues]);
    }
    res.status(200).json(apiResponse(200, false, true, [], dss));
  } catch (error) {
    console.error("Error inserting data:", error);
    res
      .status(500)
      .json(apiResponse(500, true, false, [], error.message || sww));
  }
};
exports.getFailedTitlelist = async (req, res) => {
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
    } = req.body;

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    let baseQuery = `SELECT * FROM failure_reason_with_subreasons`;
    let countQuery = `SELECT COUNT(*) AS cnt FROM failure_reason_with_subreasons`;
    let reB = [];
    let reP = [];

    // Handling date range filter
    if (start_date && end_date) {
      countQuery += ` WHERE DATE(fail_created_at) >= ? AND DATE(fail_created_at) <= ?`;
      baseQuery += ` WHERE DATE(fail_created_at) >= ? AND DATE(fail_created_at) <= ?`;
      reB.push(
        moment(start_date).format("YYYY-MM-DD"),
        moment(end_date).format("YYYY-MM-DD")
      );
      reP.push(
        moment(start_date).format("YYYY-MM-DD"),
        moment(end_date).format("YYYY-MM-DD")
      );
    }

    // Handling search filter
    if (search) {
      const searchCondition = ` WHERE (fail_title LIKE ? OR fail_status LIKE ?) `;
      countQuery += searchCondition;
      baseQuery += searchCondition;
      reB.push(`%${search}%`, `%${search}%`);
      reP.push(`%${search}%`, `%${search}%`);
    }

    // Add pagination to baseQuery
    baseQuery += " ORDER BY `fail_id` DESC LIMIT ? OFFSET ?";
    reB.push(pageSize, offset);
    reP.push(pageSize, offset);

    // Execute count query
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;

    // Execute data query
    const result = await queryDb(baseQuery, reB);

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        dgs
      )
    );
  } catch (e) {
    return res.status(500).json(apiResponse(500, true, false, [], e.message));
  }
};

exports.checkSocketHealth = (req, res) => {
  console.log("Function to call huaa ji");
  const io = getSocketIO();
  setInterval(() => {
    console.log("interval chal to rha hai ji");
    io.emit("message", "THis is simple socket testing message");
  }, 1000);
};

exports.checkNotificationHealth = async (req, res) => {
  const {
    token = "fiZEz3p8Tzym69j6LCaCM1:APA91bFhjHeZk-zAcjkZXhCKwTyrQB1LI3JSPwQBcXIAMVoxyU7p_80yeZ3pFFqY1l88PLpU5A0PP3EL4NIkK4zjPB8KyzlQK8-eRm20Kgz1oRccM1-91bg",
    title = "Testing",
    body = "Anadn",
  } = req.body;
  try {
    const data = {
      type: "full",
      person_name: "John Doe",
      description: "Claim request for services",
      amount: "$100.00",
    };
    const response = await sendPushNotification(token, data);
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.LeadNoteList = async (req, res) => {
  const { nt_lead_id } = req.body;
  if (!nt_lead_id) {
    return res
      .status(400)
      .json(apiResponse(400, true, false, [], "nt_lead_id is required"));
  }
  try {
    const query = `
      SELECT nt_id, nt_emp_id, nt_lead_id, nt_title, nt_description, nt_created_at
      FROM lead_notes
      WHERE nt_lead_id = ?
      ORDER BY nt_id DESC
    `;
    const result = await queryDb(query, [nt_lead_id]);
    return res
      .status(200)
      .json(apiResponse(200, false, true, { data: result }, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};

// Admin view of a lead's full structured follow-up history (lead_followups) —
// unlike getLeadFollowups in lead_utils (employee-only, ownership-gated), this
// has no employee-ownership restriction since any admin can view any lead.
exports.leadFollowupListAdmin = async (req, res) => {
  const { lead_id } = req.body;
  if (!lead_id) {
    return res
      .status(400)
      .json(apiResponse(400, true, false, [], "lead_id is required"));
  }
  try {
    const query = `
      SELECT lf.follow_id, lf.follow_lead_id, lf.follow_emp_id, lf.follow_type,
             lf.follow_status, lf.follow_remark, lf.follow_calling_done,
             lf.follow_next_appointment_date, lf.follow_location,
             lf.follow_meeting_mode, lf.follow_duration, lf.follow_created_at,
             emp_name
      FROM lead_followups lf
      LEFT JOIN emp_registration_details ON emp_registration_details.emp_id = lf.follow_emp_id
      WHERE lf.follow_lead_id = ?
      ORDER BY lf.follow_id DESC
    `;
    const result = await queryDb(query, [Number(lead_id)]);
    return res
      .status(200)
      .json(apiResponse(200, false, true, { data: result }, dgs));
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};

exports.EmployeStatusCount = async (req, res) => {
  try {
    const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [
      followCount,
      siteVisitCount,
      faceToFaceCount,
      revisitCount,
      totalRevisit,
      todayFollowCount,
      todaySiteVisitCount,
      todayFaceToFaceCount,
    ] = await Promise.all([
      queryDb("SELECT COUNT(*) AS count FROM `follow_up_leads`"),
      queryDb("SELECT COUNT(*) AS count FROM `site_visit`"),
      queryDb("SELECT COUNT(*) AS count FROM `face_to_face`"),
      queryDb(`
        SELECT st_vst_emp_id, COUNT(*) - 1 AS revisit_count 
        FROM site_visit 
        GROUP BY st_vst_emp_id 
        HAVING COUNT(*) > 1
      `),
      queryDb(`
        SELECT SUM(cnt - 1) AS total_revisit
        FROM (
          SELECT COUNT(*) AS cnt
          FROM site_visit
          GROUP BY st_vst_emp_id
          HAVING cnt > 1
        ) AS repeated_visits
      `),

      // Today's counts queries
      queryDb(
        `
        SELECT COUNT(*) AS count 
        FROM follow_up_leads 
        WHERE DATE(fl_created_at) = ?
      `,
        [todayDate]
      ),

      queryDb(
        `
        SELECT COUNT(*) AS count 
        FROM site_visit 
        WHERE DATE(st_vst_created_at) = ?
      `,
        [todayDate]
      ),

      queryDb(
        `
  SELECT COUNT(*) AS count
  FROM face_to_face
  WHERE DATE(fac_schdule_date) = ?
`,
        [todayDate]
      ),
    ]);

    // Today's status counts — there's no status-change-history table, so this counts
    // leads CREATED today that are currently sitting in each status (not leads that
    // transitioned into that status today, which isn't trackable with the current schema).
    const [
      todayWarmCount,
      todayHotCount,
      todayCloseCount,
      todayConvertCount,
    ] = await Promise.all([
      queryDb(
        `SELECT COUNT(*) AS count FROM lead_basic_details WHERE lead_bkt_status = 3 AND DATE(lead_created_at) = ?;`,
        [todayDate]
      ),
      queryDb(
        `SELECT COUNT(*) AS count FROM lead_basic_details WHERE lead_bkt_status = 6 AND DATE(lead_created_at) = ?;`,
        [todayDate]
      ),
      queryDb(
        `SELECT COUNT(*) AS count FROM lead_basic_details WHERE lead_bkt_status = 4 AND DATE(lead_created_at) = ?;`,
        [todayDate]
      ),
      queryDb(
        `SELECT COUNT(*) AS count FROM lead_basic_details WHERE lead_bkt_status = 5 AND DATE(lead_created_at) = ?;`,
        [todayDate]
      ),
    ]);

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: {
            followCount: followCount[0].count,
            siteVisitCount: siteVisitCount[0].count,
            faceToFaceCount: faceToFaceCount[0].count,
            revisitCount: revisitCount,
            totalRevisit: totalRevisit[0]?.total_revisit || 0,

            todayFollowCount: todayFollowCount[0].count,
            todaySiteVisitCount: todaySiteVisitCount[0].count,
            todayFaceToFaceCount: todayFaceToFaceCount[0].count,

            todayWarmCount: todayWarmCount[0].count,
            todayHotCount: todayHotCount[0].count,
            todayCloseCount: todayCloseCount[0].count,
            todayConvertCount: todayConvertCount[0].count,
          },
        },
        "Success"
      )
    );
  } catch (e) {
    return res
      .status(500)
      .json(apiResponse(true, false, [], e.message || "Internal Server Error"));
  }
};

exports.basicClaimedLeadListAdmin = async (req, res) => {
  const { userId } = req.query;
  if (!userId)
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "userId is required!"));
  try {
    const {
      search = "",
      start_date = "",
      end_date = "",
      page = 1,
      count = 10,
      lead_type = "ALL", // 1: New, 2: Cold, 3: Warm, 4: Close, 5: Convert, 6: Hot
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
    let reB = [
      Number(userId),
      Number(userId),
      Number(userId),
      Number(userId),
      Number(userId),
    ];
    if (start_date && end_date) {
      countQuery +=
        "AND  DATE(lead_created_at) >= ? AND DATE(lead_created_at) <= ? ";
      baseQuery +=
        " AND DATE(lead_created_at) >= ? AND DATE(lead_created_at) <= ? ";
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

    baseQuery += " ORDER BY `lead_id` DESC LIMIT ? OFFSET ?;";
    reB.push(pageSize, offset);
    const totalRowsResult = await queryDb(countQuery, reP);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;
    const result = await queryDb(baseQuery, reB);
    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: result,
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

exports.getAllempProfilelist = async (req, res) => {
  try {
    const { search = "", page = 1, count = 10 } = req.body;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(count), 1);
    const offset = (pageNumber - 1) * pageSize;

    // Query emp_registration_details (the real, indexed table) instead of the
    // emp_profile VIEW — emp_profile has a slow subquery baked into its definition
    // that made even a single-row lookup take 70-100+ seconds on this DB.
    let baseQuery = `SELECT * FROM emp_registration_details ep`;
    let countQuery = `SELECT COUNT(*) AS cnt FROM emp_registration_details ep`;
    let queryParams = [];
    let countParams = [];

    // Handling search filter
    if (search) {
      const searchCondition = ` WHERE (ep.emp_name LIKE ? OR ep.emp_email LIKE ?)`;
      baseQuery += searchCondition;
      countQuery += searchCondition;
      queryParams.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    // Sort by emp_id descending
    baseQuery += " ORDER BY `ep`.`emp_id` DESC LIMIT ? OFFSET ?";
    queryParams.push(pageSize, offset);

    // Execute count query, employee list, and bucket counts as separate (fast) queries
    // instead of one big JOIN — joining to the bucket-count subquery in a
    // single query was taking 100+ seconds on this DB, while each query alone is fast.
    const [totalRowsResult, result, bucketRows] = await Promise.all([
      queryDb(countQuery, countParams),
      queryDb(baseQuery, queryParams),
      queryDb(
        `SELECT
          clm_emp_id AS emp_id,
          SUM(CASE WHEN lead_bkt_status = 1 THEN 1 ELSE 0 END) AS new_cnt,
          SUM(CASE WHEN lead_bkt_status = 2 THEN 1 ELSE 0 END) AS cold_cnt,
          SUM(CASE WHEN lead_bkt_status = 3 THEN 1 ELSE 0 END) AS warm_cnt,
          SUM(CASE WHEN lead_bkt_status = 6 THEN 1 ELSE 0 END) AS hot_cnt,
          SUM(CASE WHEN lead_bkt_status = 4 THEN 1 ELSE 0 END) AS close_cnt,
          SUM(CASE WHEN lead_bkt_status = 5 THEN 1 ELSE 0 END) AS convert_cnt
        FROM claimed_interested_leads
        INNER JOIN lead_basic_details ON lead_basic_details.lead_id = claimed_interested_leads.clm_lead_id
        GROUP BY clm_emp_id;`,
        []
      ),
    ]);
    const totalRows = Number(totalRowsResult?.[0]?.cnt) || 0;

    const bucketByEmpId = bucketRows.reduce((acc, row) => {
      acc[row.emp_id] = row;
      return acc;
    }, {});

    // Add bucket_count + total_cnt_status (total leads assigned/claimed to this employee, across every status) to each employee
    const modifiedResult = result.map((row) => {
      const bc = bucketByEmpId[row.emp_id] || {};
      const bucket = {
        new_cnt: Number(bc.new_cnt) || 0,
        cold_cnt: Number(bc.cold_cnt) || 0,
        warm_cnt: Number(bc.warm_cnt) || 0,
        hot_cnt: Number(bc.hot_cnt) || 0,
        close_cnt: Number(bc.close_cnt) || 0,
        convert_cnt: Number(bc.convert_cnt) || 0,
      };
      const total_cnt_status =
        bucket.new_cnt +
        bucket.cold_cnt +
        bucket.warm_cnt +
        bucket.hot_cnt +
        bucket.close_cnt +
        bucket.convert_cnt;
      row.bucket_count = { ...bucket, total_cnt_status };

      return row;
    });

    return res.status(200).json(
      apiResponse(
        200,
        false,
        true,
        {
          data: modifiedResult,
          totalCount: totalRows,
          totalPage: Math.ceil(totalRows / pageSize),
          currPage: pageNumber,
        },
        dgs
      )
    );
  } catch (e) {
    return res.status(500).json(apiResponse(500, true, false, [], e.message));
  }
};
exports.GenerateQR = async (req, res) => {
  const { payload } = req.body;
  if (!payload) return res.status(400).json({ msg: "Payload is required" });

  const decriptData = Buffer.from(payload, "base64").toString("utf-8");
  const { email, app_name } = JSON.parse(decriptData);
  if (!email || !app_name) {
    return res.status(400).json({ msg: "Email and App name are required" });
  }

  try {
    // First, check if 2FA is already enabled for this admin
    const adminCheck = await queryDb(
      `SELECT ad_2fa_secret, ad_2fa_enabled FROM admin_login WHERE ad_lgn_email = ?`,
      [email]
    );

    if (adminCheck.length === 0) {
      return res.status(404).json({ error: true, msg: "Admin not found" });
    }

    const current2faStatus = adminCheck[0].ad_2fa_enabled;

    if (current2faStatus) {
      // If 2FA is already enabled, do NOT generate new QR or secret.
      // Just inform the frontend.
      return res.status(200).json({
        error: false,
        msg: "2FA is already enabled for this admin. Proceed to OTP verification.",
        is2faAlreadyEnabled: true, // New flag for frontend
      });
    }

    // If 2FA is NOT enabled (current2faStatus is FALSE), proceed to generate QR
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, app_name.trim(), secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

    // Store the new secret. DO NOT set ad_2fa_enabled to TRUE here.
    // It will be set to TRUE only after successful FIRST OTP verification.
    const updateResult = await queryDb(
      `UPDATE admin_login SET ad_2fa_secret = ?, ad_updated_at = NOW() WHERE ad_lgn_email = ?`,
      [secret, email]
    );

    if (updateResult.affectedRows === 0) {
      // This case should ideally not happen if adminCheck found the user
      return res
        .status(404)
        .json({ error: true, msg: "Admin not found for update" });
    }

    return res.status(200).json({
      error: false,
      msg: "QR generated successfully. Please scan and verify.",
      qrCodeUrl,
      secret, // You can send secret, but for security, it's better to verify only from DB
      is2faAlreadyEnabled: false, // New flag for frontend
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: true, msg: e.message || "Internal error" });
  }
};

exports.VerifyAuthenticator = async (req, res) => {
  const { payload } = req.body;

  if (!payload || typeof payload !== "string") {
    return res.status(400).json({
      error: true,
      msg: "Payload is required and must be a base64 string",
    });
  }

  let decryptedData;
  try {
    decryptedData = Buffer.from(payload, "base64").toString("utf-8");
    if (!decryptedData || decryptedData.trim() === "") {
      return res
        .status(400)
        .json({ error: true, msg: "Decoded payload is empty" });
    }
  } catch (e) {
    return res
      .status(400)
      .json({ error: true, msg: "Invalid base64 encoding" });
  }

  let parsed;
  try {
    parsed = JSON.parse(decryptedData);
  } catch (e) {
    return res.status(400).json({ error: true, msg: "Invalid JSON format" });
  }

  const { username, otp } = parsed;

  if (!username || !otp) {
    return res
      .status(400)
      .json({ error: true, msg: "Username and OTP required" });
  }

  try {
    // Fetch secret AND ad_2fa_enabled status
    const sql =
      "SELECT ad_2fa_secret, ad_2fa_enabled FROM admin_login WHERE ad_lgn_email = ?";
    const results = await queryDb(sql, [username]);

    if (results.length === 0) {
      return res.status(404).json({ error: true, msg: "User not found" });
    }

    const fetchedSecret = results[0].ad_2fa_secret;
    const current2faStatus = results[0].ad_2fa_enabled;

    // Implement decryption if you're storing encrypted secrets
    // const secret = decrypt(fetchedSecret); // Uncomment if using encryption
    const secret = fetchedSecret; // Use directly if not encrypting secrets in DB

    const isValid = authenticator.verify({ token: otp, secret });

    if (isValid) {
      // If 2FA was NOT already enabled, this is the first successful verification, so enable it.
      if (!current2faStatus) {
        await queryDb(
          `UPDATE admin_login SET ad_2fa_enabled = TRUE, ad_updated_at = NOW() WHERE ad_lgn_email = ?`,
          [username]
        );
        console.log(`2FA successfully enabled for ${username}`);
      }
      return res
        .status(200)
        .json({ error: false, isValid, msg: "OTP Verified Successfully" });
    } else {
      return res
        .status(401)
        .json({ error: true, isValid, msg: "Invalid OTP. Please try again." });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: true,
      msg: e.message || "Internal error during OTP verification",
    });
  }
};
