import { Add, FilterAlt, Search as SearchIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogContent,
  InputAdornment,
  Switch,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import CreateSource from './CreateSource'; // adjust path if needed

// ---- Design tokens (kept local so the page reads as one intentional system) ----
const ACCENT = '#4F46E5'; // indigo — primary action / focus
const ACCENT_SOFT = '#EEF0FF'; // header row / hover wash
const INK = '#1E1B4B'; // headings
const MUTED = '#6B7280'; // secondary text
const BORDER = '#E7E7F3';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#fff',
    fontSize: '0.85rem',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: '#C7CBF7' },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: '1.5px' },
  },
  '& input': { padding: '9px 12px' },
};

const LeadSource = () => {
  const [loading, setloading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const client = useQueryClient();

  const initialValue = {
    search: '',
    start_date: '',
    end_date: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
  });

  const { isLoading, data: leadDataSource } = useQuery(
    ['lead_data_source', page, rowsPerPage, fk],
    () => {
      const reqBody = {
        search: fk.values.search,
        start_date: fk.values.start_date,
        end_date: fk.values.end_date,
      };
      return axiosInstance.post(API_URLS.lead_source_list, {
        ...reqBody,
        page,
        count: rowsPerPage,
      });
    }
  );
  const data = leadDataSource?.data?.response || [];
  const rows = data?.data || [];

  const LeadstatusFn = async (id) => {
    setloading(true);
    try {
      const response = await axiosInstance.get(
        `${API_URLS.lead_source_status}?ld_src_id=${id}`
      );
      toast(response?.data?.msg);
      client.refetchQueries('lead_data_source');
    } catch (e) {
      toast('Something went wrong');
    } finally {
      setloading(false);
    }
  };

  return (
    <div className="p-3 md:p-6">
      <CustomCircularProgress isLoading={loading || isLoading} />

      {/* Page header */}
      <div className="breadcruumb_section">
        <div class="breadcrumb_content">
          <h3>Lead Sources</h3>
          <p>{data?.total_count ?? rows.length} source{rows.length === 1 ? '' : 's'} configured</p>
        </div>
        <div className='breadcrumb_serch'>
        <Button className="btn btn-primary"
          onClick={() => setOpenModal(true)}
          variant="contained"
          startIcon={<Add sx={{ fontSize: 18 }} />}>
          Add Source
        </Button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="card_form">
        <div className='box_mainse'>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3">
            <div className='form_input_box'>
              <label for="name">From <i>*</i></label>
              <div className='form_input'>
                <TextField
                  size="small"
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={fk.values.start_date}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">To <i>*</i></label>
              <div className='form_input'>
                 <TextField
                  size="small"
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={fk.values.end_date}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
           
            <div className="col-span-2 sm:flex-1 form_input_box">
              <div className='form_input_box'>
                <label for="name">Search <i>*</i></label>
                <div className='form_input'>
                   <TextField
                      size="small"
                      fullWidth
                      type="search"
                      id="search"
                      name="search"
                      placeholder="Search by name or description"
                      value={fk.values.search}
                      onChange={fk.handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 18, color: MUTED }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                </div>
              </div>
             
            </div>

              <Button className="main_btn_3"
                onClick={fk.handleSubmit}
                variant="contained"
                startIcon={<FilterAlt sx={{ fontSize: 17 }} />} >
                Filter
              </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card_table mt-3">
        <div className="overflow-x-auto main_table">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((i, index) => {
                  const isActive = i?.ld_src_status !== 'Deactive';
                  return (
                    <tr
                      key={i?.ld_src_id ?? index}
                      className="border-t transition-colors hover:bg-[#FAFAFF]"
                      style={{ borderColor: BORDER }}
                    >
                      <td>
                        {(page - 1) * rowsPerPage + index + 1}
                      </td>
                      <td>
                        {i?.ld_src_name}
                      </td>
                      <td>
                        {i?.ld_src_desc || 'No description'}
                      </td>
                      <td >
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: isActive ? '#15803D' : '#9CA3AF',
                            backgroundColor: isActive ? '#DCFCE7' : '#F3F4F6',
                          }}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td >
                        <Switch
                          size="small"
                          checked={isActive}
                          onClick={() => LeadstatusFn(i?.ld_src_id)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: ACCENT,
                            },
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-12" style={{ color: MUTED }}>
                    No lead sources found. Try adjusting your filters or{' '}
                    <button
                      onClick={() => setOpenModal(true)}
                      className="font-semibold underline"
                      style={{ color: ACCENT }}
                    >
                      add a new source
                    </button>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div>
          <CustomToPagination setPage={setPage} page={page} data={data} />
        </div>
      </div>

      

      {/* Add Source modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <CreateSource
            onClose={() => setOpenModal(false)}
            onSuccess={() => client.refetchQueries('lead_data_source')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadSource;