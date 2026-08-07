"user strict";
const { queryDb } = require("../helper/utilityHelper");
const isValidate = require("../checker");
const { apiResponse } = require("../helper/helperResponse");
const { sr, sww } = require("../msgHelper");
require("dotenv").config();

exports.isAdmin = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json(
        apiResponse(
          401,
          false,
          false,
          [],
          "Authorization header missing or invalid",
          false
        )
      );
  }
  const token = authHeader?.split(" ")?.[1];
  if (!token) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Missing Token", false));
  }
  const isAvailable = await queryDb(
    "SELECT `ad_lgn_id`,`ad_lgn_type` FROM `admin_login` WHERE `ad_lgn_token` = ? LIMIT 1;",
    [token]
  );
  if (!isAvailable || isAvailable?.length <= 0) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Invalid Token", false));
  }
  const userType = isAvailable?.[0]?.ad_lgn_type;
  if (userType !== "Admin" && userType!=="Super Admin")
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Routes Available for Admin"));
  next();
};
exports.isEmployee = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader || !authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json(
        apiResponse(
          401,
          false,
          false,
          [],
          "Authorization header missing or invalid"
        )
      );
  }
  const token = authHeader?.split(" ")?.[1];
  if (!token) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Missing Token"));
  }
  const isAvailable = await queryDb(
    "SELECT `lgn_id`,lgn_type,emp_id,lgn_fcm_token FROM `emp_login` INNER JOIN emp_registration_details ON emp_lgn_id = lgn_id WHERE `lgn_token` = ? LIMIT 1;",
    [token]
  );
  if (!isAvailable || isAvailable?.length <= 0) {
    return res
      .status(201)
      .json(apiResponse(201, false, false, [], "Invalid Token"));
  }
  const userType = isAvailable?.[0]?.lgn_type;
  req.userId = isAvailable?.[0]?.emp_id;
  req.userType = isAvailable?.[0]?.lgn_type;
  req.fcmToken = isAvailable?.[0]?.lgn_fcm_token;
  if (userType !== "Employee")
    return res
      .status(201)
      .json(
        apiResponse(201, false, false, [], "Routes Available for Employee")
      );
  next();
};

exports.isCheckParamer = async (req, res, next) => {
  const value = isValidate(req.body || req.query);
  if (value !== "true")
    return res.status(201).json(apiResponse(201, false, false, [], value));
  next();
};
