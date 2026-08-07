"user-strict";
const express = require("express");
const {
  adminLogin,
  employeeRegistration,
  updateEmployeeDetails,
  adminLoginAsEmployee,
  employeeList,
  employeeLoginStatus,
  createlLeadSource,
  sourceLeadList,
  leadSourceStatus,
  sourceLeadListForLeadCreation,
  contactMethodListForLeadCreation,
  basicLeadList,
  leadReportList,
  leadsByFollowupType,
  createLeadByAdminmanual,
  createLeadByAdminByExcel,
  checkSocketHealth,
  checkNotificationHealth,
  claimedListAdmin,
  addProjectDetails,
  addPhaseDetails,
  getProjectPhaseDetailsById,
  getProjectList,
  updateProjectDetails,
  updatePhaseDetails,
  updatePhaseStatus,
  proJectListDropDown,
  getAdminDashboardBucketCount,
  getBasicLeadBucketCount,
  getFollowupTypeBucketCount,
  unassignedLeadList,
  assignLeadToEmployee,
  leadListForTransfer,
  transferLeadToEmployee,
  leadProfile,
  empProfileDetails,
  addFailedTitleWithReasons,
  getFailedTitlelist,
  channelPartnerList,
  LeadNoteList,
  leadFollowupListAdmin,
  empProfileDetailsAdmin,
  employeAdminList,
  EmployeStatusCount,
  basicClaimedLeadListAdmin,
  getAllempProfilelist,
  VerifyAuthenticator,
  GenerateQR,
  admindata,
  VerifyOTP,
  employeeListForLeadCreation,
} = require("../controller/adminControllers");
const { followUpTypesList } = require("../lead_utils");
const { authCheck, isCheckParamer, isAdmin } = require("../middleware");
const validateProduct = require("../utils/Validation");
const { verify } = require("jsonwebtoken");

const router = express.Router();
router.post("/admin-login", isCheckParamer, adminLogin);
router.post(
  "/employee-registration",
  // isCheckParamer,
  isAdmin,
  employeeRegistration
);
router.post("/employee-update", isAdmin, updateEmployeeDetails);
router.post("/login-as-employee", isAdmin, adminLoginAsEmployee);
router.post("/channel-partner-list", isAdmin, channelPartnerList);
router.post("/employee-list", isAdmin, employeeList);
router.get('/employee-list-dropdown',isAdmin, employeeListForLeadCreation);
router.get("/employee-status", isCheckParamer, isAdmin, employeeLoginStatus);
router.post("/create-lead-source", isCheckParamer, isAdmin, createlLeadSource);
router.post("/lead-source-list", isAdmin, sourceLeadList);
router.get("/lead-source-status", isCheckParamer, isAdmin, leadSourceStatus);
router.get(
  "/lead-src-list-lead-creation",
  isAdmin,
  sourceLeadListForLeadCreation
);
router.get(
  "/lead-contact-method-list",
  isAdmin,
  contactMethodListForLeadCreation
);
router.post("/basic-lead-list", isAdmin, basicLeadList);
router.post("/lead-report-list", isAdmin, leadReportList);
router.post("/leads-by-followup-type", isAdmin, leadsByFollowupType);
router.post("/unassigned-lead-list", isAdmin, unassignedLeadList);
router.post("/assign-lead-to-employee", isAdmin, assignLeadToEmployee);
router.post("/lead-list-for-transfer", isAdmin, leadListForTransfer);
router.post("/transfer-lead-to-employee", isAdmin, transferLeadToEmployee);
router.post("/create-lead-list-by-admin", isAdmin, createLeadByAdminmanual);
router.post(
  "/create-lead-list-by-admin-excel",
  isAdmin,
  createLeadByAdminByExcel
);
router.get("/check-socket-health", checkSocketHealth);
router.post("/claimed-list-data-admin", isAdmin, claimedListAdmin); // ye api admin me  lgi hai..
router.get("/check-notificatoin-health", checkNotificationHealth);
router.post("/add-project-details", isAdmin, addProjectDetails);
router.post("/add-phase-details", isAdmin, addPhaseDetails);
router.get("/project-phase-details-by-id", isAdmin, getProjectPhaseDetailsById);
router.post("/project-details-list", isAdmin, getProjectList);
router.post("/update-project-details", isAdmin, updateProjectDetails);
router.post("/update-project-phases-details", isAdmin, updatePhaseDetails);
router.get("/update-phase-status", isAdmin, updatePhaseStatus);
router.get("/project-list-dropdown", isAdmin, proJectListDropDown);
router.get("/dashboard-bucket-count", isAdmin, getAdminDashboardBucketCount);
router.get("/basic-lead-bucket-count", isAdmin, getBasicLeadBucketCount);
router.get("/followup-type-bucket-count", isAdmin, getFollowupTypeBucketCount);
router.get("/lead-profile", isAdmin, leadProfile);
router.get("/get-employee-profile-by-admin", isAdmin, empProfileDetails);
router.post("/add_failed_title", isAdmin, addFailedTitleWithReasons);
router.post("/get_failed_list", isAdmin, getFailedTitlelist);
router.post("/get-lead-note-list", isAdmin, LeadNoteList);
router.post("/get-lead-followups-list", isAdmin, leadFollowupListAdmin);
router.get("/follow-up-types", isAdmin, followUpTypesList);
router.get("/get-employee-status-list", isAdmin, EmployeStatusCount);
router.post(
  "/get-bucket-wise-lead-list-by-emp-id",
  isAdmin,
  basicClaimedLeadListAdmin
);
router.post("/get-all-emp-data", isAdmin, getAllempProfilelist);
router.post("/generate-qr", isAdmin, GenerateQR);
router.post("/verify-otp-qr", isAdmin, VerifyAuthenticator);

module.exports = router;
