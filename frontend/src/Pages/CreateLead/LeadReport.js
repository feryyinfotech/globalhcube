import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import debounce from 'lodash/debounce';
import { useMemo, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import { toLocalMoment } from '../../utils/dateUtils';

const BORDER = '#E7E7F3';
const COLUMN_VISIBILITY_STORAGE_KEY = 'lead_report_column_visibility';

const loadStoredColumnVisibility = () => {
  try {
    return JSON.parse(localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
};

const columns = [
  { field: 'lead_unique_id', headerName: 'Lead ID', width: 130 },
  { field: 'lead_cust_name', headerName: 'Name', width: 170 },
  { field: 'lead_mob_no', headerName: 'Mobile', width: 130 },
  { field: 'lead_alter_mob_no' || "--", headerName: 'Alt. Mobile', width: 130 },
  { field: 'lead_email', headerName: 'Email', width: 190 },
  { field: 'ld_bkt_status', headerName: 'Status', width: 100 },
  { field: 'ld_src_name', headerName: 'Source', width: 140 },
  {
    field: 'lead_title',
    headerName: 'Product',
    width: 170,
    valueGetter: (params) => params?.row?.project_details?.pro_title || '',
  },
  { field: 'lead_sort_des', headerName: 'Remark', width: 240 },
  { field: 'emp_name', headerName: 'Assigned To', width: 150 },
  { field: 'emp_mobile', headerName: 'Assigned Mobile', width: 140 },
  { field: 'last_followup_type', headerName: 'Last Follow-up', width: 140 },
  { field: 'last_followup_remark', headerName: 'Last Follow-up Remark', width: 240 },
  {
    field: 'last_followup_at',
    headerName: 'Last Follow-up At',
    width: 170,
    valueFormatter: (params) =>
      params?.value ? toLocalMoment(params.value).format('D MMM YY, hh:mm A') : '',
  },
  // {
  //   field: 'followup_count',
  //   headerName: 'Follow-ups',
  //   width: 110,
  //   type: 'number',
  // },
  {
    field: 'lead_created_at',
    headerName: 'Created At',
    width: 170,
    valueFormatter: (params) =>
      params?.value ? toLocalMoment(params.value).format('D MMM YY, hh:mm A') : '',
  },
];

const LeadReport = () => {
  const navigate = useNavigate();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [columnVisibilityModel, setColumnVisibilityModel] = useState(
    loadStoredColumnVisibility
  );

  const handleColumnVisibilityModelChange = (model) => {
    setColumnVisibilityModel(model);
    localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(model));
  };

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
      }, 500),
    []
  );
  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

  const { data, isLoading } = useQuery(
    ['lead_report', paginationModel.page, paginationModel.pageSize, search],
    () =>
      axiosInstance.post(API_URLS.lead_report_list, {
        search,
        page: paginationModel.page + 1,
        count: paginationModel.pageSize,
      }),
    { keepPreviousData: true }
  );

  const rows = data?.data?.response?.data || [];
  const totalRows = data?.data?.response?.totalRows || 0;

  return (
    <div className="p-3">
      <div className="card_table">
        <div className="headsse justify-content-between">
          <div>
            <h5>Lead Report</h5>
            <p>
              All leads — assigned and unassigned. Search, sort and choose the
              columns you need.
            </p>
          </div>
          <div className='breadcrumb_serch'>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
            <input
              size="small"
              placeholder="Search by name, mobile, email, remark, source..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSetSearch(e.target.value);
              }}
              sx={{ width: { xs: '100%', sm: 380 }, mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </div>
        </div>

        <div className="p-4 md:p-5 bg-white">


          <div style={{ width: '100%' }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              getRowId={(row) => row.lead_id}
              loading={isLoading}
              paginationMode="server"
              rowCount={totalRows}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50, 100]}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
              onRowClick={(params) => navigate(`/profile/${params.id}`)}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: { showQuickFilter: false },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#F5F5FF',
                },
                '--DataGrid-rowBorderColor': BORDER,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadReport;
