import { toLocalMoment } from '../../utils/dateUtils';
import { useQuery } from 'react-query';
import { Link, useParams } from 'react-router-dom';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import { front_end_domain } from '../../URL';
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { RemoveRedEyeRounded } from '@mui/icons-material';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import { VscCallOutgoing } from 'react-icons/vsc';
import { VscCallIncoming } from 'react-icons/vsc';
import PhoneMissedIcon from '@mui/icons-material/PhoneMissed';

const LeadProfile = () => {
  const { lead_id } = useParams();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);

  const { isLoading, data: profile } = useQuery(
    ['profile_list', lead_id],
    () => axiosInstance.get(`${API_URLS.lead_profile}?lead_id=${lead_id}`),
    {
      enabled: !!lead_id,
    }
  );
  const lead = profile?.data?.response?.[0];

  const { loading, data: call_logs } = useQuery(
    ['call_deatils', lead_id],
    () => axiosInstance.get(`${API_URLS.call_logs_admin}?lead_id=${lead_id}`),
    {
      enabled: !!lead_id,
    }
  );
  const call_details = call_logs?.data?.response?.[0];
  console.log(call_details);

  const { isLoading: ploading, data: empDialogData } = useQuery(
    ['employee_details_dialog', selectedEmpId],
    () =>
      axiosInstance.get(`${API_URLS.employee_profile}?emp_id=${selectedEmpId}`),
    {
      enabled: !!selectedEmpId && openDialog,
    }
  );
  const employeeDialogInfo = empDialogData?.data?.response?.[0];

  return (
    <>
      <CustomCircularProgress isLoading={isLoading || loading} />
      <div className="p-6 space-y-8 w-full max-w-6xl mx-auto">
        {/* Lead Info Card */}
        <section className="border rounded p-4 shadow bg-white">
          <h2 className="text-lg font-semibold mb-4">Lead Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <p>
              <strong>Customer Name:</strong> {lead?.lead_cust_name}
            </p>
            <p>
              <strong>Primary Mobile:</strong> {lead?.lead_mob_no}
            </p>
            <p>
              <strong>Alternate Mobile:</strong> {lead?.lead_alter_mob_no}
            </p>
            <p>
              <strong>Email:</strong> {lead?.lead_email || 'N/A'}
            </p>
            <p>
              <strong>Lead Source:</strong> {lead?.ld_src_name}
            </p>
            <p>
              <strong>Contact Type:</strong> {lead?.ld_cont_name}
            </p>
            <p>
              <strong>Status:</strong> {lead?.ld_bkt_status}
            </p>
            <p>
              <strong>Created By:</strong> {lead?.lead_inserted_by}
            </p>
            <p>
              <strong>Created At:</strong>{' '}
              {toLocalMoment(lead?.lead_created_at).format('DD-MM-YYYY, hh:mm:ss A')}
            </p>
            <p className="col-span-2">
              <strong>Remark:</strong> {lead?.lead_sort_des || 'N/A'}
            </p>
          </div>
        </section>

        {/* Project Details */}
        {lead?.project_details?.pro_unique_id && (
          <section className="border rounded p-4 shadow bg-white">
            <h2 className="text-lg font-semibold mb-4">Project Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <p className="flex gap-5">
                <strong> Image:</strong>
                <img
                  src={`${front_end_domain}/${lead?.project_details?.pro_image}`}
                  alt="Project"
                  className="w-20 border rounded"
                />{' '}
              </p>
              <p>
                <strong>Project Title:</strong> {lead.project_details.pro_title}
              </p>
              <p>
                <strong>Unique ID:</strong> {lead.project_details.pro_unique_id}
              </p>
              <p>
                <strong>Description:</strong>{' '}
                {lead.project_details.pro_full_description}
              </p>
              <p>
                <strong>Short Description:</strong>{' '}
                {lead.project_details.pro_sort_description}
              </p>
            </div>
            <div className="mt-4"></div>
            {lead?.project_details?.phase_detailsss?.phase_details && (
              <>
                <h2 className="text-lg font-semibold mb-4">Phase Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <p>
                    <strong>Phase Details:</strong>
                    {lead?.project_details?.phase_detailsss?.phase_details ? (
                      <Link
                        to={`${front_end_domain}/${lead?.project_details?.phase_detailsss?.phase_details}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="mx-4 text-red-500"> View PDF</span>
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                  <p>
                    <strong>Phase Brouchers:</strong>
                    {lead?.project_details?.phase_detailsss?.phase_brouchure ? (
                      <Link
                        to={`${front_end_domain}/${lead?.project_details?.phase_detailsss?.phase_brouchure}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="mx-4 text-red-500"> View PDF</span>
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                  <p>
                    <strong>Phase Floor Plan:</strong>
                    {lead?.project_details?.phase_detailsss
                      ?.phase_floor_plans ? (
                      <Link
                        to={`${front_end_domain}/${lead?.project_details?.phase_detailsss?.phase_floor_plans}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="mx-4 text-red-500"> View PDF</span>
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                  <p>
                    <strong>Phase Direction :</strong>{' '}
                    {lead?.project_details?.phase_detailsss?.phase_direction}
                  </p>
                  <p>
                    <strong>Phase Discreption :</strong>{' '}
                    {lead?.project_details?.phase_detailsss?.phase_description}
                  </p>
                  <p>
                    <strong>Phase Website :</strong>{' '}
                    {lead?.project_details?.phase_detailsss?.phase_website}
                  </p>
                </div>
              </>
            )}
          </section>
        )}

        {/* Channel Partner Details */}
        {lead?.channel_partner_details?.cp_name && (
          <section className="border rounded p-4 shadow bg-white">
            <h2 className="text-lg font-semibold mb-4">
              Channel Partner Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <strong>Name:</strong> {lead?.channel_partner_details?.cp_name}
              </p>
              <p>
                <strong>Mobile:</strong>{' '}
                {lead?.channel_partner_details?.cp_mobile_no}
              </p>
              <p>
                <strong>Firm Name:</strong>{' '}
                {lead?.channel_partner_details?.cp_firm_name}
              </p>
              <p>
                <strong>Localities:</strong>{' '}
                {lead?.channel_partner_details?.cp_operation_localities}
              </p>
              <p>
                <strong>Unique ID:</strong>{' '}
                {lead?.channel_partner_details?.cp_unique_id}
              </p>
              <p>
                <strong>Created At:</strong>{' '}
                {toLocalMoment(lead?.channel_partner_details?.cp_created_at)?.format(
                  'DD-MM-YYYY'
                )}
              </p>
              <p>
                <strong>Email:</strong>{' '}
                {lead?.channel_partner_details?.cp_email}
              </p>
            </div>
          </section>
        )}

        {/* Created By Section */}
        {lead?.created_by &&
          Object.values(lead.created_by).some((val) => val !== null) && (
            <section className="border rounded p-4 shadow bg-white">
              <h2 className="text-lg font-semibold mb-4">Lead Generated By</h2>
              <div className="grid grid-cols-2 gap-4">
                <p>
                  <strong>Name:</strong> {lead.created_by.emp_name || 'N/A'}
                </p>
                <p>
                  <strong>Email:</strong> {lead.created_by.emp_email || 'N/A'}
                </p>
                <p>
                  <strong>Mobile:</strong> {lead.created_by.emp_mobile || 'N/A'}
                </p>
                <p>
                  <strong>Address:</strong>{' '}
                  {lead.created_by.emp_address || 'N/A'}
                </p>
              </div>
            </section>
          )}

        {/* Claimed By Section */}
        {lead?.claimed_by &&
          Object.values(lead?.claimed_by).some((val) => val !== null) && (
            <section className="border rounded p-4 shadow bg-white">
              <h2 className="text-lg font-semibold mb-4">Claimed By</h2>
              <div className="grid grid-cols-2 gap-4">
                <p>
                  <strong>Name:</strong> {lead?.claimed_by?.emp_name || 'N/A'}
                </p>
                <p>
                  <strong>Email:</strong> {lead?.claimed_by?.emp_email || 'N/A'}
                </p>
                <p>
                  <strong>Mobile:</strong>{' '}
                  {lead?.claimed_by?.emp_mobile || 'N/A'}
                </p>
                <p>
                  <strong>Emp Details:</strong>{' '}
                  <button
                    className="text-blue-600 underline"
                    onClick={() => {
                      setSelectedEmpId(lead?.claimed_by?.emp_lgn_id);
                      setOpenDialog(true);
                    }}
                  >
                    {' '}
                    <RemoveRedEyeRounded />
                  </button>
                </p>
                <p>
                  <strong>Address:</strong>{' '}
                  {lead?.claimed_by?.emp_address || 'N/A'}
                </p>
              </div>
            </section>
          )}
        {/* Face-to-Face / Site Visit / Follow-Up Details */}
        {lead?.fol_face_site_details && (
          <section className="border rounded p-4 shadow bg-white">
            {Array.isArray(lead.fol_face_site_details.face_to_face_details) &&
              lead.fol_face_site_details.face_to_face_details.some(
                (item) => item?.['`fac_id`']
              ) && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Face to Face Meetings</h3>
                  <table className="w-full table-auto border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border">Schedule Date</th>
                        <th className="p-2 border">Duration</th>
                        <th className="p-2 border">Meeting Mode</th>
                        <th className="p-2 border">Reminder</th>
                        <th className="p-2 border">Destination</th>
                        <th className="p-2 border">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.fol_face_site_details.face_to_face_details.map(
                        (item, index) =>
                          item['`fac_id`'] && (
                            <tr key={index} className="text-sm">
                              <td className="p-2 border">
                                {item['`fac_schdule_date`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`fac_duration`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`fac_meeting_mode`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`fac_reminder`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`fac_destination`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`fac_add_note`'] || 'N/A'}
                              </td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            {Array.isArray(lead.fol_face_site_details.site_visit_details) &&
              lead.fol_face_site_details.site_visit_details.some(
                (item) => item?.['`st_vst_id`']
              ) && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Site Visits</h3>
                  <table className="w-full table-auto border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border">Schedule Date</th>
                        <th className="p-2 border">Duration</th>
                        <th className="p-2 border">Location</th>
                        <th className="p-2 border">Meeting Mode</th>
                        <th className="p-2 border">Reminder</th>
                        <th className="p-2 border">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.fol_face_site_details.site_visit_details.map(
                        (item, index) =>
                          item['`st_vst_id`'] && (
                            <tr key={index} className="text-sm">
                              <td className="p-2 border">
                                {item['`st_vst_schdule_date`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`st_vst_duration`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`st_vst_location`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`st_vst_meeting_mode`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`st_vst_reminder`'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['`st_vst_add_note`'] || 'N/A'}
                              </td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            {Array.isArray(lead.fol_face_site_details.follow_details) &&
              lead.fol_face_site_details.follow_details.some(
                (item) => item?.['fl_id']
              ) && (
                <div>
                  <h3 className="font-semibold mb-2">Follow-Up Notes</h3>
                  <table className="w-full table-auto border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border">Created At</th>
                        <th className="p-2 border">Schedule Date</th>
                        <th className="p-2 border">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lead.fol_face_site_details.follow_details.map(
                        (item, index) =>
                          item?.['fl_id'] && (
                            <tr key={index} className="text-sm">
                              <td className="p-2 border">
                                {item['fl_created_at'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['fl_schedule_on'] || 'N/A'}
                              </td>
                              <td className="p-2 border">
                                {item['fl_make_note'] || 'N/A'}
                              </td>
                            </tr>
                          )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        )}

        {/* Extended Details */}
        {lead?.extended_details?.ex_email && (
          <section className="border rounded p-4 shadow bg-white">
            <h2 className="text-lg font-semibold mb-4">Extended Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <strong>Email:</strong>{' '}
                {lead.extended_details['`ex_email`'] || 'N/A'}
              </p>
              <p>
                <strong>Mobile:</strong>{' '}
                {lead.extended_details['`ex_mobile`'] || 'N/A'}
              </p>
              <p>
                <strong>Additional Note:</strong>{' '}
                {lead.extended_details['`ex_add_note`'] || 'N/A'}
              </p>
              <p>
                <strong>Stay Duration:</strong>{' '}
                {lead.extended_details['`ex_stay_duration`'] || 'N/A'}
              </p>
              <p>
                <strong>Preferred Size:</strong>{' '}
                {lead.extended_details['`ex_preferred_size`'] || 'N/A'}
              </p>
              <p>
                <strong>Budget Title:</strong>{' '}
                {lead.extended_details['`ex_lead_budget_id`']?.[
                  '`bud_title`'
                ] || 'N/A'}
              </p>
              <p>
                <strong>Preferred Floor:</strong>{' '}
                {lead.extended_details['`ex_preferred_floor`'] || 'N/A'}
              </p>
              <p>
                <strong>Purpose of Buy:</strong>{' '}
                {lead.extended_details['`ex_purpose_of_buy`'] || 'N/A'}
              </p>
              <p>
                <strong>Vastu Preference:</strong>{' '}
                {lead.extended_details['`ex_vastu_preference`'] || 'N/A'}
              </p>
              <p>
                <strong>Expected Buy Time:</strong>{' '}
                {lead.extended_details['`ex_expected_buy_time`'] || 'N/A'}
              </p>
              <p>
                <strong>Loan Details Shared:</strong>{' '}
                {lead.extended_details['`ex_loan_details_share`'] || 'N/A'}
              </p>
              <p>
                <strong>Expected Down Payment:</strong>{' '}
                {lead.extended_details['`ex_expected_down_payment`'] || 'N/A'}
              </p>
              <p>
                <strong>Old Property for Sale:</strong>{' '}
                {lead.extended_details['`ex_have_old_existing_pro_for_sell`'] ||
                  'N/A'}
              </p>
              <p>
                <strong>Loan Sanction First:</strong>{' '}
                {lead.extended_details[
                  '`ex_does_loan_need_sanctioned_first`'
                ] || 'N/A'}
              </p>
              <p>
                <strong>Commercial Purpose Interest:</strong>{' '}
                {lead.extended_details[
                  '`ex_interested_in_commercial_purpose`'
                ] || 'N/A'}
              </p>
              <p>
                <strong>Transport Mode:</strong>{' '}
                {lead.extended_details['`ex_mod_of_transport_id`']?.[
                  '`tr_md_title`'
                ] || 'N/A'}
              </p>
              <p>
                <strong>Interested Property Type:</strong>{' '}
                {lead.extended_details['`ex_interested_property_type_id`']?.[
                  '`prop_title`'
                ] || 'N/A'}
              </p>
            </div>
          </section>
        )}
        {lead?.failure_reasons && (
          <section className="border rounded p-4 shadow bg-white">
            <h2 className="text-lg font-semibold mb-4">Failure Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <p>
                <strong>Status:</strong>{' '}
                {lead.failure_reasons?.fal_is_active || 'N/A'}
              </p>
            </div>
            <div className="mt-4">
              {lead?.failure_reasons?.fal_reason &&
                (() => {
                  let parsedReasons = [];
                  try {
                    parsedReasons = JSON.parse(
                      lead.failure_reasons?.fal_reason
                    );
                  } catch (error) {
                    console.error('Invalid JSON in fal_reason:', error);
                  }

                  return (
                    parsedReasons.length > 0 && (
                      <section className="border rounded p-4 shadow bg-white">
                        <div className="mt-4">
                          <h3 className="text-md font-semibold mb-2">
                            Failure Reasons:
                          </h3>
                          {parsedReasons.map((reason, index) => (
                            <div key={index} className="mb-2">
                              <p>
                                <strong>Main Reason:</strong>{' '}
                                {reason.main_reason_id}
                              </p>
                              <ul className="list-disc list-inside">
                                {reason.sub_reason_id.map((sub, idx) => (
                                  <li key={idx}>{sub}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    )
                  );
                })()}
            </div>
          </section>
        )}
        {call_details && (
          <section className="border rounded p-5 shadow bg-white">
            <h2 className="text-lg font-semibold mb-4">Call Log Details</h2>
            <div className="overflow-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2 border-b">Caller </th>
                    <th className="p-2 border-b">Caller No. </th>
                    <th className="p-2 border-b">Status</th>
                    <th className="p-2 border-b">Receiver No.</th>
                    <th className="p-2 border-b">Call Start Time</th>
                    <th className="p-2 border-b">Call End Time</th>
                    <th className="p-2 border-b"> Duration </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="p-2 border-b">
                      <div className="font-medium">
                        {lead?.claimed_by?.emp_name || 'N/A'}
                      </div>
                    </td>
                    <td className="p-2 border-b">
                      <div className=" text-sm">
                        {call_details?.cl_caller_number}
                      </div>
                    </td>

                    <td className="p-2 border-b">
                      <span className="inline-block">
                        {call_details?.cl_call_type === 'outgoing' ? (
                          <VscCallOutgoing className="!text-green-700 !text-lg" />
                        ) : call_details?.cl_call_type === 'incoming' ? (
                          <VscCallIncoming className="!text-blue-800 !text-lg" />
                        ) : (
                          <PhoneMissedIcon className="!text-red-800 !text-lg" />
                        )}
                      </span>
                    </td>
                    <td className="p-2 border-b">
                      {call_details?.cl_receiver_number}
                    </td>
                    <td className="p-2 border-b text-xs sm:text-sm">
                      {call_details?.cl_start_time}
                    </td>
                    <td className="p-2 border-b text-xs sm:text-sm">
                      {call_details?.cl_end_time}
                    </td>
                    <td className="p-2 border-b text-xs sm:text-sm">
                      {call_details?.cl_duration_seconds} Sec
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        <Dialog
          open={openDialog}
          // onClose={handleClose}
          aria-describedby="alert-dialog-slide-description"
          PaperProps={{ className: '!max-w-[1000px]' }}
        >
          <DialogTitle>Employee Bucket Status </DialogTitle>
          <DialogContent>
            <table className="w-full table-auto border border-gray-300 mt-2">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 text-left">Title</th>
                  <th className="border px-2 text-left">Count</th>
                </tr>
              </thead>
              <tbody>
                {employeeDialogInfo?.bucket_count &&
                  Object.entries({
                    New: employeeDialogInfo.bucket_count.new_cnt,
                    Cold: employeeDialogInfo.bucket_count.cold_cnt,
                    Warm: employeeDialogInfo.bucket_count.warm_cnt,
                    Hot: employeeDialogInfo.bucket_count.hot_cnt,
                    Close: employeeDialogInfo.bucket_count.close_cnt,
                    Convert: employeeDialogInfo.bucket_count.convert_cnt,
                    'OutDated Event':
                      employeeDialogInfo.bucket_count.out_dated_evnt_cnt,
                    Ignore: employeeDialogInfo.bucket_count.ignored_cnt,
                  }).map(([title, count], idx) => (
                    <tr key={idx}>
                      <td className="border px-2">{title}</td>
                      <td className="border px-2">{count ?? 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default LeadProfile;
