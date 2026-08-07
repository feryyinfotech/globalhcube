"user-strict";
const express = require("express");
const {
  adminLogin,
  basicLeadList,
  followupDetails,
  updateRatingDetails,
  notificationList,
  addLeadMoreInfo,
  getLeadDetailsById,
  sourceLeadListForLeadCreation,
  proJectListDropDown,
} = require("../controller/adminControllers");
const { authCheck, isCheckParamer, isEmployee } = require("../middleware");
const validateProduct = require("../utils/Validation");
const {
  statusList,
  empLogin,
  claimLeadByEmp,
  basicClaimedLeadList,
  createLeadByEmp,
  addUpdateBookingInfo,
  bookingLeadList,
  updateMeetingDoneStatus,
  getActivityLogs,
  getFollowFaceSiteVisitList,
  getDashboardData,
  getProjectPhaseDetailsForShareKit,
  getEmployeeList,
  getFollowupTypeBucketCountEmp,
  leadsByFollowupTypeEmp,
  getWeeklyLeadTrendEmp,
  getLeadSourceBreakdownEmp,
} = require("../controller/employeeControllers");
const {
  durationAndReminderUtilityData,
  leadUpdateRelatedDropDowns,
  failureReasonDropDown,
  failLeadHandler,
  getFailLeadList,
  recoverFailLead,
  moveToNextStatus,
  getScheduledLeads,
  getPhaseByProjectId,
  addChannelPartner,
  getChannelPartnerList,
  createSelfLead,
  rescheduleLeads,
  channepPartnerProfile,
  empProfile,
  addUpdateNotes,
  getLeadNotes,
  addLeadFollowup,
  getLeadFollowups,
  followUpTypesList,
  getTodaysPendingFollowupsEmp,
  leadTransferredHistory,
  transferLead,
} = require("../lead_utils");
const router = express.Router();
router.post("/emp-login", empLogin);
router.get("/status-list", isEmployee, statusList);
router.get("/claime-lead", isEmployee, claimLeadByEmp);
router.post("/claimed-lead", isEmployee, basicClaimedLeadList); // list
router.get(
  "/followup-type-bucket-count-emp",
  isEmployee,
  getFollowupTypeBucketCountEmp
);
router.post("/create-lead-emp", isEmployee, createLeadByEmp);
router.post(
  "/leads-by-followup-type-emp",
  isEmployee,
  leadsByFollowupTypeEmp
);
// Employee-safe versions of the admin-only dropdown lookups used by the
// "Create Lead" form — same data, but gated by isEmployee instead of isAdmin
// so an employee token doesn't get treated as an "Invalid Token" and force-logged-out.
router.get(
  "/lead-src-list-lead-creation-emp",
  isEmployee,
  sourceLeadListForLeadCreation
);
router.get("/project-list-dropdown-emp", isEmployee, proJectListDropDown);
router.post("/follow-up-lead", isEmployee, followupDetails);
router.get("/duration-reminder", isEmployee, durationAndReminderUtilityData);
router.get("/update-lead-utility-data", isEmployee, leadUpdateRelatedDropDowns);
router.post("/update-rating-deails", isEmployee, updateRatingDetails);
router.post("/emp-notificaion-list", isEmployee, notificationList);
router.post("/add-more-lead-info", isEmployee, addLeadMoreInfo);
router.get("/get-lead-details-by-id", isEmployee, getLeadDetailsById);
router.get("/get-failure-reason-dropdown", isEmployee, failureReasonDropDown);
router.post("/lead-failed-form", isEmployee, failLeadHandler);
router.get("/get-failed-lead-list", isEmployee, getFailLeadList); // list
router.post("/recover-faild-lead", isEmployee, recoverFailLead);
router.post("/move-to-next-status", isEmployee, moveToNextStatus);
router.post("/scheduled-leads-list", isEmployee, getScheduledLeads);
router.post("/add-update-booking-details", isEmployee, addUpdateBookingInfo);
router.post("/booking-lead-list", isEmployee, bookingLeadList);
router.post("/update-meeting-status", isEmployee, updateMeetingDoneStatus);
router.post("/get-activity-logs", isEmployee, getActivityLogs);
router.post(
  "/get-follow-face-site-data",
  isEmployee,
  getFollowFaceSiteVisitList
);
router.get("/get-dashboard-data-emp", isEmployee, getDashboardData);
router.get("/weekly-lead-trend-emp", isEmployee, getWeeklyLeadTrendEmp);
router.get(
  "/lead-source-breakdown-emp",
  isEmployee,
  getLeadSourceBreakdownEmp
);
router.get(
  "/get-project-phase-share-kit",
  isEmployee,
  getProjectPhaseDetailsForShareKit
);
router.get("/get-phase-details-by-project-id", isEmployee, getPhaseByProjectId);
router.post("/add-channel-partner", isEmployee, addChannelPartner);
router.post("/get-channel-partner-list", isEmployee, getChannelPartnerList);
router.post("/create-self-lead", isEmployee, createSelfLead);
router.post("/reschedult-leads", isEmployee, rescheduleLeads);
router.get("/channel-partner-profile", isEmployee, channepPartnerProfile);
router.get("/employee-profile", isEmployee, empProfile);
router.post("/add-update-lead-notes", isEmployee, addUpdateNotes);
router.post("/get-lead-notes", isEmployee, getLeadNotes);
router.post("/add-lead-followup", isEmployee, addLeadFollowup);
router.post("/get-lead-followups", isEmployee, getLeadFollowups);
router.get("/follow-up-types-emp", isEmployee, followUpTypesList);
router.get(
  "/todays-pending-followups-emp",
  isEmployee,
  getTodaysPendingFollowupsEmp
);
//anand
router.post("/lead-transfer", isEmployee, transferLead);
router.get("/lead-transfer-history", isEmployee, leadTransferredHistory);
router.get("/get-employee-list", isEmployee, getEmployeeList);


module.exports = router;
