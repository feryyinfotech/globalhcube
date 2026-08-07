import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, IconButton } from '@mui/material';
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

const DATE_FORMAT = 'DD-MM-YYYY HH:mm';

const formatDate = (value) =>
  value ? toLocalMoment(value).format(DATE_FORMAT) : 'N/A';

const FollowupTypeLeads = ({ mode = 'type' }) => {
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
    ['followup_types'],
    () => axiosInstance.get(API_URLS.followup_types),
    { refetchOnWindowFocus: false, enabled: mode !== 'next_appointment' }
  );
  const followupTypes = followupTypesData?.data?.response || [];
  const activeType = followupTypes.find((t) => t.flw_typ_slug === slug);
  const followupTypeTitle =
    mode === 'next_appointment'
      ? 'Next Appointment'
      : activeType?.flw_typ_title || '';

  const { isLoading, data: leadData } = useQuery(
    ['followup_type_leads', mode, slug, followupTypeTitle, page, search],
    () =>
      axiosInstance.post(API_URLS.leads_by_followup_type, {
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
      ['followup_history_admin', followupHistoryLead?.lead_id],
      () =>
        axiosInstance.post(API_URLS.lead_followups_list_admin, {
          lead_id: followupHistoryLead?.lead_id,
        }),
      { enabled: !!followupHistoryLead }
    );
  const followupHistory = followupHistoryData?.data?.response?.data || [];

  const hideNextAppointment = ['Lead Close', 'Sale Done'].includes(
    followupTypeTitle
  );

  // Kept as named variables so the conditional column can never unbalance
  // the brackets inside the array literals below.
  const nextAppointmentHead = hideNextAppointment
    ? []
    : [<span key="head-next">Next Appointment</span>];

  const nextAppointmentCell = (i) =>
    hideNextAppointment
      ? []
      : [
          <span key={`next-${i?.lead_id}`}>
            {formatDate(i?.type_followup_next_appointment_date)}
          </span>,
        ];

  const tablehead = [
    <span key="head-sno">S.No</span>,
    <span key="head-lead">Lead ID</span>,
    <span key="head-emp">Assigned To</span>,
    <span key="head-date">Follow-up Date</span>,
    <span key="head-remark">Remark</span>,
    ...nextAppointmentHead,
  ];

  const tablerow = data.map((i, idx) => [
    <span key={`sno-${i?.lead_id}`}>{(page - 1) * rowsPerPage + idx + 1}</span>,
    <span
      key={`lead-${i?.lead_id}`}
      className="font-medium text-blue-600 cursor-pointer underline"
      onClick={() => setFollowupHistoryLead(i)}
    >
      {i?.lead_unique_id}
    </span>,
    <span key={`emp-${i?.lead_id}`}>{i?.emp_name || 'Unassigned'}</span>,
    <span key={`date-${i?.lead_id}`}>{formatDate(i?.type_followup_at)}</span>,
    <span key={`remark-${i?.lead_id}`}>{i?.type_followup_remark || 'N/A'}</span>,
    ...nextAppointmentCell(i),
  ]);

  return (
    <div className="p-3">
      <CustomCircularProgress isLoading={isLoading} />
      <div className="card_table">
        <div className="headsse justify-content-between">
          <div>
            <h5> {followupTypeTitle || 'Follow-up'} Leads </h5>
            <p>Leads that have ever had a "{followupTypeTitle}" follow-up</p>
          </div>
          <div className="breadcrumb_serch">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              placeholder="Search by Lead ID, Name, Mobile..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSetSearch(e.target.value);
              }}
            />
          </div>
        </div>

        <CustomTable
          tablehead={tablehead}
          tablerow={tablerow}
          isLoading={isLoading}
        />

        <div>
          <CustomToPagination
            setPage={setPage}
            page={page}
            data={responseData}
          />
        </div>
      </div>

      <Dialog
        open={!!followupHistoryLead}
        onClose={() => setFollowupHistoryLead(null)}
        fullWidth
      >
        <div className="modal_heading">
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
                <div key={f.follow_id} className="cards_bubble ms-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap bhead_bubble">
                    <span className="buble_type">{f.follow_type}</span>
                    {f.emp_name && (
                      <div className="remark_text">By: {f.emp_name}</div>
                    )}
                    <span className="date_bubble">
                      {toLocalMoment(f.follow_created_at).format(DATE_FORMAT)}
                    </span>
                  </div>

                  <div className="remark_text">{f.follow_remark}</div>

                  <div className="bfoot_bubble">
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
                          DATE_FORMAT
                        )}
                      </div>
                    )}
                    {(f.follow_location ||
                      f.follow_meeting_mode ||
                      f.follow_duration) && (
                      <div className="connect_time">
                        {[
                          f.follow_location,
                          f.follow_meeting_mode,
                          f.follow_duration,
                        ]
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

export default FollowupTypeLeads;