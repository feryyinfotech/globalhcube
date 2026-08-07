import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { TextField } from '@mui/material';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import { toLocalMoment } from '../../utils/dateUtils';

// ---- Design tokens (consistent with EmpDashboard / EmpCreateLead) ----
const ACCENT = 'linear-gradient(135deg, var(--blue-500), var(--blue-700))';
const INK = '#1E1B4B';
const MUTED = '#6B7280';
const BORDER = '#D9E5F7';

const LEAD_BUCKET_STATUS_IDS = {
  New: 1,
  Cold: 2,
  Warm: 3,
  Close: 4,
  Convert: 5,
  Hot: 6,
};
const statusOptions = ['New', 'Cold', 'Warm', 'Hot', 'Close', 'Convert'];
const statusColors = {
  New: 'bg-green-100 text-green-800',
  Cold: 'bg-blue-100 text-blue-700',
  Warm: 'bg-orange-100 text-orange-800',
  Hot: 'bg-pink-100 text-pink-700',
  Close: 'bg-red-100 text-red-600',
  Convert: 'bg-teal-100 text-teal-800',
};

const EmpUpdateFollow = () => {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFollowupType, setSelectedFollowupType] = useState('All');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
        setPage(1);
      }, 500),
    []
  );
  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

  const { isLoading, data: leadData } = useQuery(
    [
      'emp_update_follow_leads',
      page,
      rowsPerPage,
      selectedStatus,
      selectedFollowupType,
      search,
    ],
    () =>
      axiosInstance.post(API_URLS.emp_claimed_lead_list, {
        search,
        page,
        count: rowsPerPage,
        lead_type: LEAD_BUCKET_STATUS_IDS[selectedStatus]
          ? String(LEAD_BUCKET_STATUS_IDS[selectedStatus])
          : 'ALL',
        followup_type:
          selectedFollowupType === 'All' ? 'ALL' : selectedFollowupType,
      })
  );
  const data = leadData?.data?.response || [];
  const leads = data?.data || [];

  const { data: followupCountInfo } = useQuery(
    ['emp_followup_type_bucket_count'],
    () => axiosInstance.get(API_URLS.followup_type_bucket_count_emp),
    { refetchOnWindowFocus: false }
  );
  const followupCounts = (followupCountInfo?.data?.response || []).reduce(
    (acc, item) => {
      acc[item.follow_type] = item.cnt;
      return acc;
    },
    {}
  );

  const { data: followupTypesData } = useQuery(
    ['followup_types_emp'],
    () => axiosInstance.get(API_URLS.followup_types_emp),
    { refetchOnWindowFocus: false }
  );
  const followupTypes = followupTypesData?.data?.response || [];

  return (
    <div className="p-3 md:p-6">
      <CustomCircularProgress isLoading={isLoading} />
      <div className="breadcruumb_section">
        <div className="breadcrumb_content">
          <h3>Update Follow</h3>
          <p>Pick a lead to log a follow-up update</p>
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



      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => {
            setSelectedStatus('All');
            setPage(1);
          }}
          className="pill-btn"
          style={
            selectedStatus === 'All'
              ? { background: ACCENT, color: '#fff', borderColor: ACCENT }
              : { color: INK, background: '#fff' }
          }
        >
          All
        </button>
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => {
              setSelectedStatus(status);
              setPage(1);
            }}
            className="pill-btn"
            style={
              selectedStatus === status
                ? { background: ACCENT, color: '#fff', borderColor: ACCENT }
                : { color: INK, background: '#fff' }
            }
          >
            {status}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>
          Follow-up:
        </span>
        <button
          onClick={() => {
            setSelectedFollowupType('All');
            setPage(1);
          }}
          className="pill-btn"
          style={
            selectedFollowupType === 'All'
              ? { background: ACCENT, color: '#fff', borderColor: ACCENT }
              : { color: INK, background: '#fff' }
          }
        >
          All
        </button>
        {followupTypes.map((type) => (
          <button
            key={type.flw_typ_title}
            onClick={() => {
              setSelectedFollowupType(type.flw_typ_title);
              setPage(1);
            }}
            className="pill-btn"
            style={
              selectedFollowupType === type.flw_typ_title
                ? { background: ACCENT, color: '#fff', borderColor: ACCENT }
                : { color: INK, background: '#fff' }
            }
          >
            {type.flw_typ_title} ({followupCounts?.[type.flw_typ_title] || 0})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {leads.length > 0 ? (
          leads.map((i) => (
            <div
              key={i?.lead_id}
              className="follow_card">
              <div className='follow_name flex items-center justify-between mb-3 pt-3 px-3 gap-2 flex-wrap'>
                <div className="flex items-center gap-2">
                  <span className='name_text'>{i?.lead_cust_name
                      ? i.lead_cust_name.charAt(0).toUpperCase()
                      : 'P'}
                  </span>
                  <h4>{i?.lead_cust_name || 'N/A'}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[i?.ld_bkt_status] ||
                      'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {i?.ld_bkt_status || 'N/A'}
                  </span>
                  <button
                    onClick={() =>
                      navigate(`/employee-lead-followup/${i.lead_id}`, {
                        state: { lead: i },
                      })
                    }
                    className="follow_btns">
                    <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />
                    Follow Up
                  </button>
                </div>
              </div>
              <div className='follne_id px-3'>
                <ul className='mb-3'>
                  <li>
                    <p>Lead ID / Mobile</p>
                    <b>#{i?.lead_unique_id}, {i?.lead_mob_no || 'N/A'}</b>
                  </li>
                   <li>
                    <p>Products</p>
                    <span>
                      {i?.project_details?.pro_title || 'N/A'}
                    </span>
                  </li>
                  <li>
                    <p>Source</p>
                    <span>{i?.ld_src_name || 'N/A'}</span>
                  </li>
                  <li>
                    <p>Enquired</p>
                    <span>
                      {' '} {i?.lead_created_at
                      ? toLocalMoment(i.lead_created_at).format('D MMM YY, hh:mm A')
                      : 'N/A'}
                    </span>
                  </li>
                  
                </ul>
                {i?.lead_sort_des && (
                <p className="Text_messages mb-3" style={{ color: MUTED }}>
                  {i.lead_sort_des}
                </p>
              )}
              </div>
              
              
              
              
              {i?.last_followup_type && (
                <div
                  className="border-t flex items-center justify-between px-3 py-2"
                  style={{ borderColor: BORDER }}
                >
                <div className='flex items-center gap-3'>
                  <span className="follow_types">{i.last_followup_type}</span>
                  <p className='remark_text mb-0'>{i?.last_followup_remark}</p>
                </div>
                  
                  <p className="text-sm mb-0" style={{ color: MUTED }}>
                    
                    {i?.last_followup_at && (
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>
                        {toLocalMoment(i.last_followup_at).format('D MMM YY, hh:mm A')}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10" style={{ color: MUTED }}>
            No leads found.
          </div>
        )}
      </div>

      <div className="mt-3">
        <CustomToPagination setPage={setPage} page={page} data={data} />
      </div>

    </div>
  );
};

export default EmpUpdateFollow;
