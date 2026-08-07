import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import CustomTable from '../../Shared/CustomTable';
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

// Every column the table can show, in default order. `sortKey` (when set)
// is the field on the raw lead object used for client-side sorting; columns
// without one (S.No, Product, Last Follow-up) aren't sortable.
const ALL_COLUMNS = [
  { key: 'sno', label: 'S.No' },
  { key: 'lead_id', label: 'Lead ID', sortKey: 'lead_unique_id' },
  { key: 'name', label: 'Customer Name', sortKey: 'lead_cust_name' },
  { key: 'mobile', label: 'Mobile', sortKey: 'lead_mob_no' },
  { key: 'status', label: 'Status', sortKey: 'ld_bkt_status' },
  { key: 'source', label: 'Source', sortKey: 'ld_src_name' },
  { key: 'product', label: 'Product' },
  { key: 'remark', label: 'Remark', sortKey: 'lead_sort_des' },
  { key: 'last_followup', label: 'Last Follow-up' },
  { key: 'enquired', label: 'Enquired', sortKey: 'lead_created_at' },
];
const COLUMN_VISIBILITY_STORAGE_KEY = 'emp_lead_list_visible_columns';
const loadVisibleColumns = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY));
    if (stored && typeof stored === 'object') return stored;
  } catch (e) {
    // fall through to default
  }
  return ALL_COLUMNS.reduce((acc, col) => {
    acc[col.key] = true;
    return acc;
  }, {});
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'new':
      return { backgroundColor: '#DBEAFE', color: '#1D4ED8' };
    case 'cold':
      return { backgroundColor: '#CFFAFE', color: '#0E7490' };
    case 'warm':
      return { backgroundColor: '#FEF3C7', color: '#B45309' };
    case 'hot':
      return { backgroundColor: '#FEE2E2', color: '#DC2626' };
    case 'close':
      return { backgroundColor: '#E2E8F0', color: '#475569' };
    case 'convert':
      return { backgroundColor: '#DCFCE7', color: '#15803D' };
    default:
      return { backgroundColor: '#F3F4F6', color: '#6B7280' };
  }
};

const EmpLeadList = () => {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFollowupType, setSelectedFollowupType] = useState('All');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [followupHistoryLead, setFollowupHistoryLead] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(loadVisibleColumns);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const columnMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setColumnMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleSort = (sortKey) => {
    setSort((prev) =>
      prev.key === sortKey
        ? { key: sortKey, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: sortKey, dir: 'asc' }
    );
  };

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
      'emp_lead_list_table',
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

  // Sorting is applied client-side to the current page's rows — the app's
  // pagination is server-side, so this only ever sorts the ~10 rows already
  // on screen (no separate "sort" request needed).
  const sortedLeads = useMemo(() => {
    if (!sort.key) return leads;
    const copy = [...leads];
    copy.sort((a, b) => {
      const av = a?.[sort.key];
      const bv = b?.[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [leads, sort]);

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

  const { data: followupHistoryData, isLoading: isFollowupHistoryLoading } =
    useQuery(
      ['emp_lead_followup_history', followupHistoryLead?.lead_id],
      () =>
        axiosInstance.post(API_URLS.get_lead_followups_emp, {
          lead_id: followupHistoryLead?.lead_id,
        }),
      { enabled: !!followupHistoryLead }
    );
  const followupHistory = followupHistoryData?.data?.response || [];

  const columnDefs = ALL_COLUMNS.filter((col) => visibleColumns[col.key] !== false);

  const headerCell = (col) =>
    col.sortKey ? (
      <span
        className="cursor-pointer select-none inline-flex items-center gap-1"
        onClick={() => toggleSort(col.sortKey)}
      >
        {col.label}
        {sort.key === col.sortKey ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
      </span>
    ) : (
      <span>{col.label}</span>
    );

  const tablehead = columnDefs.map(headerCell);

  const rowCellByKey = (i, idx, key) => {
    switch (key) {
      case 'sno':
        return <span>{(page - 1) * rowsPerPage + idx + 1}</span>;
      case 'lead_id':
        return (
          <span className="font-medium text-blue-600">{i?.lead_unique_id}</span>
        );
      case 'name':
        return <span>{i?.lead_cust_name || 'N/A'}</span>;
      case 'mobile':
        return <span>{i?.lead_mob_no || 'N/A'}</span>;
      case 'status':
        return (
          <span
            style={{
              ...getStatusColor(i?.ld_bkt_status),
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            {i?.ld_bkt_status || 'N/A'}
          </span>
        );
      case 'source':
        return <span>{i?.ld_src_name || 'N/A'}</span>;
      case 'product':
        return <span>{i?.project_details?.pro_title || 'N/A'}</span>;
      case 'remark':
        return <span>{i?.lead_sort_des || 'N/A'}</span>;
      case 'last_followup':
        return (
          <span
            className="text-indigo-600 cursor-pointer underline"
            onClick={() => setFollowupHistoryLead(i)}
          >
            {i?.last_followup_type
              ? `${i.last_followup_type} (${i.followup_count})`
              : 'None'}
          </span>
        );
      case 'enquired':
        return (
          <span>
            {i?.lead_created_at
              ? toLocalMoment(i.lead_created_at).format('D MMM YY, hh:mm A')
              : 'N/A'}
          </span>
        );
      default:
        return <span>N/A</span>;
    }
  };

  const tablerow = sortedLeads.map((i, idx) =>
    columnDefs.map((col) => rowCellByKey(i, idx, col.key))
  );

  return (
    <div className="p-3 md:p-6">
      <CustomCircularProgress isLoading={isLoading} />

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
                : { background: '#fff' }
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
              : { background: '#fff' }
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
                : { backgroundColor: '#fff' }
            }
          >
            {type.flw_typ_title} ({followupCounts?.[type.flw_typ_title] || 0})
          </button>
        ))}
      </div>

      <div className="card_table">
        <div className="headsse justify-content-between">
          <div>
            <h5>Lead List</h5>
            <p>Leads you created, or that were assigned to you</p>
          </div>
          <div className="flex items-center gap-2" style={{ position: 'relative' }}>
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
            <button
              type="button"
              className="pill-btn"
              style={{ background: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => setColumnMenuOpen((prev) => !prev)}
            >
              <TuneIcon sx={{ fontSize: 16 }} /> Columns
            </button>
            {columnMenuOpen && (
              <div
                ref={columnMenuRef}
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  zIndex: 20,
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '8px 4px',
                  minWidth: 190,
                  boxShadow: '0 8px 24px rgba(16,24,40,0.12)',
                }}
              >
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2"
                    style={{
                      padding: '6px 10px',
                      fontSize: 13,
                      color: INK,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key] !== false}
                      onChange={() => toggleColumn(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <CustomTable tablehead={tablehead} tablerow={tablerow} isLoading={isLoading} />

        <div>
          <CustomToPagination setPage={setPage} page={page} data={data} />
        </div>
      </div>

      <Dialog
        open={!!followupHistoryLead}
        onClose={() => setFollowupHistoryLead(null)}
        fullWidth
      >
        <DialogTitle>
          Follow-up History
          <IconButton
            aria-label="close"
            onClick={() => setFollowupHistoryLead(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {isFollowupHistoryLoading ? (
            <p>Loading...</p>
          ) : followupHistory.length > 0 ? (
            <div className="space-y-4">
              {followupHistory.map((f) => (
                <div
                  key={f.follow_id}
                  className="border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                      {f.follow_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {toLocalMoment(f.follow_created_at).format('DD-MM-YYYY HH:mm')}
                    </span>
                  </div>
                  <div className="text-gray-700">{f.follow_remark}</div>
                  {f.follow_type === 'Calling' &&
                    f.follow_calling_done !== null && (
                      <div className="mt-1 text-sm text-gray-500">
                        Calling Done: {f.follow_calling_done ? 'Yes' : 'No'}
                      </div>
                    )}
                  {f.follow_next_appointment_date && (
                    <div className="mt-1 text-sm text-gray-500">
                      Next Appointment:{' '}
                      {toLocalMoment(f.follow_next_appointment_date).format(
                        'DD-MM-YYYY HH:mm'
                      )}
                    </div>
                  )}
                  {(f.follow_location ||
                    f.follow_meeting_mode ||
                    f.follow_duration) && (
                      <div className="mt-1 text-sm text-gray-500">
                        {[f.follow_location, f.follow_meeting_mode, f.follow_duration]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
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

export default EmpLeadList;
