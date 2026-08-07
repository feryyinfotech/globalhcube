import CloseIcon from '@mui/icons-material/Close';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import CustomTable from '../../Shared/CustomTable';
import CustomToPagination from '../../Shared/CustomToPagination';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import { toLocalMoment } from '../../utils/dateUtils';

const INK = '#1E1B4B';
const MUTED = '#6B7280';

// Generic page powering the per-follow-up-type / per-status / next-appointment
// sidebar menus on the employee side, scoped to this employee's own claimed
// leads.
// - mode="type" (default): the type comes from the route's :slug, resolved
//   against follow_up_types-emp, and leads are matched on follow_type.
// - mode="status": same slug-resolution, but leads are matched on the
//   independent follow_status field instead.
// - mode="next_appointment": no slug — matches any lead with a follow-up that
//   has a next-appointment date set, regardless of its type.
const EmpFollowupTypeLeads = ({ mode = 'type' }) => {
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [followupHistoryLead, setFollowupHistoryLead] = useState(null);

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
        setPage(1);
      }, 500),
    []
  );
  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

  const { data: followupTypesData } = useQuery(
    ['followup_types_emp'],
    () => axiosInstance.get(API_URLS.followup_types_emp),
    { refetchOnWindowFocus: false, enabled: mode !== 'next_appointment' }
  );
  const followupTypes = followupTypesData?.data?.response || [];
  const activeType = followupTypes.find((t) => t.flw_typ_slug === slug);
  const followupTypeTitle =
    mode === 'next_appointment' ? 'Next Appointment' : activeType?.flw_typ_title || '';

  const { isLoading, data: leadData } = useQuery(
    ['followup_type_leads_emp', mode, slug, followupTypeTitle, page, search],
    () =>
      axiosInstance.post(API_URLS.leads_by_followup_type_emp, {
        ...(mode === 'next_appointment'
          ? { next_appointment_only: true }
          : mode === 'status'
            ? { follow_status: followupTypeTitle }
            : { followup_type: followupTypeTitle }),
        search,
        page,
        count: rowsPerPage,
      }),
    { enabled: mode === 'next_appointment' || !!followupTypeTitle }
  );
  const responseData = leadData?.data?.response || {};
  const data = responseData.data || [];

  const { data: followupHistoryData, isLoading: isFollowupHistoryLoading } =
    useQuery(
      ['followup_history_emp', followupHistoryLead?.lead_id],
      () =>
        axiosInstance.post(API_URLS.get_lead_followups_emp, {
          lead_id: followupHistoryLead?.lead_id,
        }),
      { enabled: !!followupHistoryLead }
    );
  const followupHistory = followupHistoryData?.data?.response || [];
  const doneTypes = [
    'Site Visit Done',
    'Office Meeting Done',
    'Home BOP Done',
    'Lead Close',
    'Sale Done',
    'Office Group BOP Done',
    'Office One to One BOP Done',
    'Plot Meeting Done',
    'Online BOP Done',
  ];

  const showNextAppointment =
    mode === 'next_appointment' || !doneTypes.includes(followupTypeTitle);

  const tablehead = [
    <span>S.No</span>,
    <span>Lead ID</span>,
    <span>Product Name</span>,
    <span>Lead Source</span>,
    <span>Follow-up Type</span>,
    <span>Remark</span>,
    ...(showNextAppointment ? [<span>Next Appointment</span>] : []),
    // <span>Location / Mode / Duration</span>,

  ];

  const tablerow = data.map((i, idx) => [
    <span>{(page - 1) * rowsPerPage + idx + 1}</span>,

    <span
      className="font-medium text-blue-600 cursor-pointer underline"
      onClick={() => setFollowupHistoryLead(i)}
    >
      {i?.lead_unique_id}
    </span>,
    <span>{i?.project_details?.pro_title || 'N/A'}</span>,
    <span>{i?.ld_src_name || 'N/A'}</span>,
    <span>{i?.last_followup_type || followupTypeTitle || 'N/A'}</span>,
    <span>{i?.last_followup_remark || 'N/A'}</span>,
    ...(showNextAppointment
      ? [
        <span>
          {i.type_followup_next_appointment_date
            ? toLocalMoment(i.type_followup_next_appointment_date).format(
              'DD-MM-YYYY HH:mm'
            )
            : 'N/A'}
        </span>,
      ]
      : []),
    // <span>
    //   {[
    //     i?.type_followup_location,
    //     i?.type_followup_meeting_mode,
    //     i?.type_followup_duration,
    //   ]
    //     .filter(Boolean)
    //     .join(' · ') || 'N/A'}
    // </span>,
  ]);

  return (
    <div className="p-4 md:p-6">
      <CustomCircularProgress isLoading={isLoading} />


      <div className='card_table'>
        <div className="headsse justify-content-between">
          <div>
            <h5>{followupTypeTitle || 'Follow-up'} Leads</h5>
            <p>
              {mode === 'next_appointment'
                ? 'Your leads with an upcoming appointment scheduled'
                : mode === 'status'
                  ? `Your leads marked with the "${followupTypeTitle}" status`
                  : `Your leads that have ever had a "${followupTypeTitle}" follow-up`}
            </p>
          </div>
          <div className="breadcrumb_serch">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
              <input
                size="small"
                placeholder="Search by Lead ID, Name, Mobile..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSetSearch(e.target.value);
                }}
              />
            </div>
        </div>
        <CustomTable tablehead={tablehead} tablerow={tablerow} isLoading={isLoading} />

        <div >
          <CustomToPagination setPage={setPage} page={page} data={responseData} />
        </div>
      </div>

      <Dialog
        open={!!followupHistoryLead}
        onClose={() => setFollowupHistoryLead(null)}
        fullWidth
      >
        <div className='modal_heading'>
          <h3>Follow-up History</h3>
          <IconButton
            aria-label="close"
            onClick={() => setFollowupHistoryLead(null)}
            sx={{ position: 'absolute', right: 8, top: 7 }}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <DialogContent>
          {isFollowupHistoryLoading ? (
            <p>Loading...</p>
          ) : followupHistory.length > 0 ? (
            <div className="space-y-3">
              {followupHistory.map((f) => (
                <div
                  key={f.follow_id}
                  className="cards_bubble ms-0"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap bhead_bubble">
                    <span className="buble_type">
                      {f.follow_type}
                    </span>
                    <span className="date_bubble">
                      {toLocalMoment(f.follow_created_at).format('DD-MM-YYYY HH:mm')}
                    </span>
                  </div>
                  <p className="remark_text">{f.follow_remark}</p>
                  <div className='bfoot_bubble'>
                    {f.follow_type === 'Calling' &&
                      f.follow_calling_done !== null && (
                        <div className="connect_time">
                          Calling Done: {f.follow_calling_done ? 'Yes' : 'No'}
                        </div>
                      )}
                    {f.follow_next_appointment_date && (
                      <div className="next_apointment">
                        Next:{' '}
                        {toLocalMoment(f.follow_next_appointment_date).format(
                          'DD-MM-YYYY HH:mm'
                        )}
                      </div>
                    )}
                    {(f.follow_location ||
                      f.follow_meeting_mode ||
                      f.follow_duration) && (
                        <div className="connect_time">
                          {[f.follow_location, f.follow_meeting_mode, f.follow_duration]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No follow-ups available.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmpFollowupTypeLeads;
