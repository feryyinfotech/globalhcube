import { Download, FileDownload, FilterAlt } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';
import { IoEyeOutline } from 'react-icons/io5';
import { useQuery, useQueryClient } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import { toLocalMoment } from '../../utils/dateUtils';

const LEAD_BUCKET_STATUS_IDS = {
  New: 1,
  Cold: 2,
  Warm: 3,
  Close: 4,
  Convert: 5,
  Hot: 6,
};

const LeadList = () => {
  const location = useLocation();
  const initialSelectedStatus = location?.state?.selectedStatus || 'All';
  const [selectedStatus, setSelectedStatus] = useState(initialSelectedStatus);
  const [selectedFollowupType, setSelectedFollowupType] = useState('All');
  const [loading, setloding] = useState(false);
  const [file, setFile] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [page1, setPage1] = useState(1);
  const [ismore, setIsmore] = useState(false);
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [followups, setFollowups] = useState([]);
  const [noteLeadDescription, setNoteLeadDescription] = useState('');
  const client = useQueryClient();
  const rowsPerPage = 10;
  const rowsPerPage1 = 10;
  const navigate = useNavigate();
  const [empId, setEmpId] = useState(null);
  const [shouldFetchLeads, setShouldFetchLeads] = useState(false);

  const initialValue = {
    search: '',
    start_date: '',
    end_date: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
  });

  const [searchInput, setSearchInput] = useState('');
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value) => {
        fk.setFieldValue('search', value);
        setPage(1);
      }, 500),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

  const { isLoading, data: leadData } = useQuery(
    ['lead_data', page, rowsPerPage, selectedStatus, selectedFollowupType, fk.values],
    () => {
      const reqBody = {
        search: fk.values.search,
        start_date: fk.values.start_date,
        end_date: fk.values.end_date,
        lead_type:
          selectedStatus === 'Fresh'
            ? 'FRESH'
            : LEAD_BUCKET_STATUS_IDS[selectedStatus]
              ? String(LEAD_BUCKET_STATUS_IDS[selectedStatus])
              : 'ALL',
        followup_type:
          selectedFollowupType === 'All' ? 'ALL' : selectedFollowupType,
      };

      return axiosInstance.post(API_URLS.basic_lead_list, {
        ...reqBody,
        page: page,
        count: rowsPerPage,
      });
    }
  );

  const data = leadData?.data?.response || [];

  const fetchNotes = async (leadId, leadDescription = '') => {
    setloding(true);
    setNoteLeadDescription(leadDescription);
    try {
      const res = await axiosInstance.post(API_URLS.lead_followups_list_admin, {
        lead_id: leadId,
      });
      if (res?.data?.response?.data) {
        setFollowups(res.data.response.data);
      } else {
        setFollowups([]);
      }
      setOpenNoteModal(true);
    } catch (error) {
      console.error(error);
      Swal.fire('Error fetching follow-ups', '', 'error');
    } finally {
      setloding(false);
    }
  };

  const { isloading: ploading, data: count_info } = useQuery(
    ['basic_lead_bucket_count'],
    () => axiosInstance.get(API_URLS?.basic_lead_bucket_count),
    {
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    }
  );
  const count_info_data = count_info?.data?.response || {};

  const statusOptions = ['Fresh', 'New', 'Cold', 'Warm', 'Hot', 'Close', 'Convert'];

  // Convert count_info_data to a mapping object for easier lookup
  const statusCounts = Array.isArray(count_info_data)
    ? count_info_data.reduce((acc, item) => {
      acc[item.ld_bkt_status] = item.cnt;
      return acc;
    }, {})
    : {};

  const { data: followupCountInfo } = useQuery(
    ['followup_type_bucket_count'],
    () => axiosInstance.get(API_URLS?.followup_type_bucket_count),
    {
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    }
  );
  const followupCounts = (followupCountInfo?.data?.response || []).reduce(
    (acc, item) => {
      acc[item.follow_type] = item.cnt;
      return acc;
    },
    {}
  );

  const { data: followupTypesData } = useQuery(
    ['followup_types'],
    () => axiosInstance.get(API_URLS?.followup_types),
    { refetchOnWindowFocus: false }
  );
  const followupTypes = followupTypesData?.data?.response || [];

  const handleUpload = async () => {
    setOpenDialog(false);
    if (!file) {
      return Swal.fire({
        icon: 'warning',
        title: 'No File Selected',
        text: 'Please select an Excel file to upload.',
        confirmButtonColor: '#F39C12',
      });
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to upload this Excel file?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, upload it!',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        setloding(true);
        const res = await axiosInstance.post(
          API_URLS?.create_lead_list_by_admin_excel,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        Swal.fire({
          icon:
            res?.data?.msg === 'Data inserted successfully'
              ? 'success'
              : 'error',
          title:
            res?.data?.msg === 'Data inserted successfully'
              ? 'Upload Successful'
              : 'Upload Error',
          text: res?.data?.msg,
          customClass: {
            confirmButton: 'swal-confirm-btn',
            cancelButton: 'swal-cancel-btn',
          },
        });
        client.refetchQueries('lead_data');
        setOpenDialog(false);
        setFile(null);
      } finally {
        setloding(false);
      }
    }
  };
  const { isEmpLoading, data: Eployeedata } = useQuery(['all_emp_list'], () => {
    const reqBody = {
      search: '',
    };
    // This list feeds the "Lead Owners" bar, which needs every employee (for the
    // "+N More Agent" dropdown) — not just one page's worth, so request a large count.
    const response = axiosInstance.post(API_URLS.get_all_emp_list, {
      ...reqBody,
      page: 1,
      count: 1000,
    });
    return response;
  });
  const empdataRaw = Eployeedata?.data?.response?.data || [];
  const empdata = useMemo(
    () =>
      [...empdataRaw].sort((a, b) =>
        (a?.emp_name || '').localeCompare(b?.emp_name || '')
      ),
    [empdataRaw]
  );
  const [empSearchInput, setEmpSearchInput] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const debouncedSetEmpSearch = useMemo(
    () => debounce((value) => setEmpSearch(value), 300),
    []
  );
  useEffect(
    () => () => debouncedSetEmpSearch.cancel(),
    [debouncedSetEmpSearch]
  );
  const moreAgents = empdata.slice(3);
  const filteredMoreAgents = empSearch
    ? moreAgents.filter((item) =>
      (item?.emp_name || '')
        .toLowerCase()
        .includes(empSearch.toLowerCase())
    )
    : moreAgents;

  const { isuploading, data: Eployeedatafilter } = useQuery(
    ['all_emp_list_filter', empId, page1, rowsPerPage1],
    async () => {
      const response = await axiosInstance.post(
        API_URLS.get_emp_list_lead + `?userId=${empId}`,
        {
          search: '',
          start_date: '',
          end_date: '',
          page: page1,
          count: rowsPerPage1,
        }
      );
      return response.data;
    },
    {
      enabled: !!empId && shouldFetchLeads,
      keepPreviousData: true, // helpful for pagination
    }
  );

  const empdatafilter = Eployeedatafilter?.response?.data || [];

  const leadsToRender = empId ? empdatafilter : data?.data || [];
  const selectedEmp = empdata.find((emp) => emp.emp_id === empId);

  return (
    <>
      <CustomCircularProgress
        isLoading={isEmpLoading || isuploading || isLoading}
      />
      <div className="p-3">
        <div className="flex px-2 gap-2 py-2 items-center flex-wrap justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold">Lead Owners : </span>
            {empdata?.slice(0, 3)?.map((item) => {
              const isSelected = empId === item?.emp_id;
              return (
                <button
                  key={item?.emp_id}
                  onClick={() => {
                    setEmpId(item?.emp_id);
                    setShouldFetchLeads(true);
                    setSelectedStatus(null);
                  }}
                  className={`pill-btn
          ${isSelected
                      ? 'bg-[#0f52b5] text-white border-[#0f52b5]'
                      : ''
                    }
        `}
                >
                  {item?.emp_name} - ({item?.bucket_count?.total_cnt_status})
                </button>
              );
            })}
            {empdata?.length > 3 && (
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setIsmore(!ismore)}
                  className="text-sm text-blue-600 underline px-2 py-1 "
                >
                  +{empdata.length - 3} More Agent
                </button>

                {ismore && (
                  <div
                    className="absolute left-0 mt-1 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 max-h-72 overflow-y-auto"
                    role="menu"
                  >
                    <div className="sticky top-0 bg-white px-3 py-3 border-b">
                      <div className='form_input'>
                        <input
                          size="small"
                          fullWidth
                          placeholder="Search employee..."
                          value={empSearchInput}
                          onChange={(e) => {
                            setEmpSearchInput(e.target.value);
                            debouncedSetEmpSearch(e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    <div className="py-1">
                      {filteredMoreAgents.length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No employee found
                        </div>
                      )}
                      {filteredMoreAgents.map((item) => (
                        <button
                          key={item?.emp_id}
                          onClick={() => {
                            setEmpId(item?.emp_id);
                            setShouldFetchLeads(true);
                            setSelectedStatus(null);
                            setIsmore(false);
                            setEmpSearchInput('');
                            setEmpSearch('');
                          }}
                          className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          role="menuitem"
                        >
                          {item?.emp_name} - (
                          {item?.bucket_count?.total_cnt_status})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className='breadcrumb_serch'>
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
              <input
                size="small"
                name="search"
                placeholder="Search by Lead ID, Name, Mobile..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSetSearch(e.target.value);
                }}
                className="w-48"
              />
              <button className='btn btn-primary'
                variant="contained"
                startIcon={<Download />}
                onClick={() => setOpenDialog(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg>
                Export Excel
              </button>
            </div>

            {/* <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/sample-lead-template.xls';
                link.download = 'sample-lead-template.xls';
                link.click();
              }}
              sx={{
                borderColor: '#000',
                color: '#000',
                '&:hover': {
                  borderColor: '#333',
                  backgroundColor: '#f5f5f5',
                },
              }}
            >

            </Button> */}
          </div>

        </div>



        <div className="flex items-center gap-2 p-2 mt-2 border-b border-gray-300 flex-wrap overflow-x-auto">
          <button
            className={`pill-btn !w-fit ${selectedStatus === 'All'
              ? '!bg-[#0f52b5] !text-white'
              : 'k'
              }`}
            onClick={() => {
              setSelectedStatus('All');
              setEmpId(null);
            }}
          >
            All
            <span className="ml-1">
              ({statusCounts?.['Total Leads'] || 0})
            </span>
          </button>

          {statusOptions.map((status) => (
            <button
              key={status}
              className={`pill-btn !w-fit ${selectedStatus === status
                ? '!bg-[#0f52b5] !text-white'
                : ''
                }`}
              onClick={() => {
                setSelectedStatus(status);
                setEmpId(null);
              }}
            >
              {status}
              <span className="ml-1">
                ({statusCounts?.[status] || 0})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 p-2 mt-2 flex-wrap overflow-x-auto">
          <span className="text-xs font-semibold text-gray-500 mr-1">
            Follow-up:
          </span>

          <button
            className={`pill-btn !w-fit ${selectedFollowupType === "All"
              ? "!bg-[#0f52b5] !text-white"
              : ""
              }`}
            onClick={() => {
              setSelectedFollowupType("All");
              setPage(1);
            }}
          >
            All
          </button>

          {followupTypes.map((type) => (
            <button
              key={type.flw_typ_title}
              className={`pill-btn !w-fit ${selectedFollowupType === type.flw_typ_title
                ? "!bg-[#0f52b5] !text-white"
                : ""
                }`}
              onClick={() => {
                setSelectedFollowupType(type.flw_typ_title);
                setPage(1);
              }}
            >
              {type.flw_typ_title}
              <span className="ml-1">
                ({followupCounts?.[type.flw_typ_title] || 0})
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            Loading leads...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {leadsToRender.length > 0 ? (
              leadsToRender.map((i) => {
                const statusColors = {
                  New: 'bg-green-200 text-green-800',
                  Cold: 'bg-blue-100 text-blue-700',
                  Warm: 'bg-orange-100 text-orange-800',
                  Hot: 'bg-pink-100 text-pink-700',
                  Close: 'bg-red-100 text-red-500',
                  Convert: 'bg-teal-100 text-teal-800',
                };
                return (
                  <div
                    key={i?.lead_id}
                    className="follow_card"
                  >
                    <div className='follow_name flex items-center justify-between mb-3 pt-3 px-3 gap-2 flex-wrap'>
                      <div className="flex items-center gap-2">
                        <span className='name_text'>
                          {i?.lead_cust_name
                            ? i.lead_cust_name.charAt(0).toUpperCase()
                            : 'P'}
                        </span>
                        <h4>{i?.lead_cust_name}{' '}</h4>
                      </div>
                      <div className="d-flex items-center emploew_ex mb-0 px-0">
                        {selectedEmp && (
                          <div className="emploew_exse">
                            <span>
                              {selectedEmp.emp_name} / {selectedEmp.emp_mobile}
                            </span>
                          </div>
                        )}
                        {!selectedEmp && i?.emp_name && (
                          <div className="emploew_exse">
                            <span>
                              {i.emp_name} / {i?.emp_mobile}
                            </span>
                          </div>
                        )}
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
                            fetchNotes(i?.lead_id, i?.lead_sort_des)
                          }
                          className="follow_btns">
                          <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} />
                          Follow-ups ({i?.followup_count || 0})
                        </button>
                      </div>
                    </div>
                    <div className='follne_id px-3'>
                      <ul className='mb-3'>
                        <li>
                          <p>Lead ID / Mobile</p>
                          <b><span onClick={() => navigate(`/profile/${i?.lead_id}`)}>
                            #{i?.lead_unique_id}
                          </span>{' '}
                            ,<span>{i?.lead_mob_no || 0}</span></b>
                        </li>
                        <li>
                          <p>Products</p>
                          <span>
                            {i?.lead_title}
                          </span>
                        </li>
                        <li>
                          <p>Source</p>
                          <span>{i?.ld_src_name || 'N/A'}</span>
                        </li>
                        <li>
                          <p>Enquired</p>
                          <span>
                            {' '}
                            {toLocalMoment(i?.lead_created_at).format(
                              'D MMM YY, hh:mm A'
                            )}
                          </span>
                        </li>
                      </ul>
                      {i?.lead_sort_des && (
                        <p className="Text_messages mb-3">
                          {i.lead_sort_des}
                        </p>
                      )}
                    </div>





                    {i?.last_followup_type && (
                      <div className="border-t flex items-center justify-between px-3 py-2"
                      >
                        <div className='flex items-center gap-3'>
                          <span className="follow_types">{i.last_followup_type}</span>
                          <p className='remark_text mb-0'>{i?.last_followup_remark}</p>
                        </div>
                        <p className="text-sm mb-0" >

                          {i?.last_followup_at && (
                            <span className="text-xs" style={{ color: '#9CA3AF' }}>
                              {toLocalMoment(i.last_followup_at).format('D MMM YY, hh:mm A')}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No leads found for the selected criteria.
              </div>
            )}
          </div>
        )}
        {empId ? (
          <CustomToPagination
            setPage={setPage1}
            page={page1}
            data={Eployeedatafilter?.response}
          />
        ) : (
          <CustomToPagination setPage={setPage} page={page} data={data} />
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Upload Excel File
            <IconButton
              aria-label="close"
              onClick={() => setOpenDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files[0])}
              className="border border-gray-400 p-2 rounded"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUpload} variant="contained" color="primary">
              Submit
            </Button>
            <Button onClick={() => setOpenDialog(false)} variant="outlined">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openNoteModal}
          onClose={() => setOpenNoteModal(false)}
          fullWidth
        >
          <div className='modal_heading'>
            <h3>Follow-up History</h3>
            <IconButton
              aria-label="close"
              onClick={() => setOpenNoteModal(false)}
              sx={{ position: 'absolute', right: 8, top: 7 }}
            >
              <CloseIcon />
            </IconButton>
          </div>

          <DialogContent>
            {noteLeadDescription && (
              <div className="cards_bubble ms-0 mb-3">
                <h4 className="font-bold text-sm text-gray-500 mb-1">
                  Remark
                </h4>
                <div className="remark_text">{noteLeadDescription}</div>
              </div>
            )}
            {followups.length > 0 ? (
              <div className="space-y-3">
                {followups.map((f) => (
                  <div
                    key={f.follow_id}
                    className="cards_bubble ms-0"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap bhead_bubble">
                      <span className="buble_type">
                        {f.follow_type}
                      </span>
                      {f.emp_name && (
                        <span className="text-xs text-gray-500">
                          by {f.emp_name}
                        </span>
                      )}
                      <span className="date_bubble">
                       {toLocalMoment(f.follow_created_at)?.format(
                        'DD-MM-YYYY HH:mm:ss'
                      )}
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
                        <div className="next_apointment">
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
    </>
  );
};

export default LeadList;
