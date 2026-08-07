import { Button, MenuItem, TextField } from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation, useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/CustomDialogBox';

const ACCENT = '#4F46E5';
const INK = '#2857D2';
const BORDER = '#E7E7F3';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#EBE9FD',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: '#C7CBF7' },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: '1.5px' },
  },
  '& .MuiInputBase-input': { padding: '8px 10px', fontSize: '0.85rem' },
  '& .MuiSelect-select': { padding: '8px 10px', fontSize: '0.85rem' },
};

const SectionTitle = ({ children }) => (
  <p
    className="text-[11px] font-bold tracking-wide uppercase mb-2.5"
    style={{ color: ACCENT }}
  >
    {children}
  </p>
);

const FieldLabel = ({ children }) => (
  <p className="font-semibold text-xs mb-1" style={{ color: INK }}>
    {children}
  </p>
);

const AddLead = () => {
  const [loding, setloding] = useState(false);
  const navigate = useNavigate();

  const initialValue = {
    lead_cust_name: '',
    lead_email: '',
    lead_title: '',
    lead_mob_no: '',
    lead_business: 'selectbusiness',
    lead_gender: 'selectgender',
    lead_city: '',
    lead_state: '',
    lead_country: '',
    lead_source: 'selectsource',
    lead_alter_mob_no: '',
    lead_sort_des: '',
    lead_project_id: 'selectproject',
    lead_assign_to: 'selectemployee',
    lead_bkt_status: 'selectstatus',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
    onSubmit: (values) => {
      mutate(values);
    },
  });

  const { isLoading, mutate } = useMutation(
    async (values) => {
      setloding(true);
      const reqBody = {
        lead_cust_name: values.lead_cust_name,
        lead_email: values.lead_email,
        lead_mob_no: String(values.lead_mob_no) || '',
        lead_alter_mob_no: String(values.lead_alter_mob_no) || '',
        lead_source: values.lead_source,
        lead_title: 'Tested',
        lead_business:
          values.lead_business !== 'selectbusiness' ? values.lead_business : '',
        lead_gender:
          values.lead_gender !== 'selectgender' ? values.lead_gender : '',
        lead_city: values.lead_city,
        lead_state: values.lead_state,
        lead_country: values.lead_country,
        lead_sort_des: values.lead_sort_des,
        lead_project_id: String(values.lead_project_id),
        // Assigning an employee is optional — only send a real id, never the
        // "Select Employee" placeholder value.
        lead_assign_to:
          values.lead_assign_to && values.lead_assign_to !== 'selectemployee'
            ? String(values.lead_assign_to)
            : '',
        lead_bkt_status:
          values.lead_bkt_status !== 'selectstatus'
            ? String(values.lead_bkt_status)
            : '',
      };
      return axiosInstance.post(API_URLS.create_lead_list_by_admin, reqBody);
    },
    {
      onSuccess: (response) => {
        const msg = response?.data?.msg;
        toast(msg);
        if (msg === 'Data Saved Successfully') {
          navigate('/basic_lead');
          fk.resetForm();
        }
        setloding(false);
      },
      onError: (error) => {
        toast('Error saving data');
        console.error(error);
        setloding(false);
      },
    }
  );

  const { data } = useQuery(
    ['creation_source'],
    () => axiosInstance.get(API_URLS?.lead_src_list_lead_creation),
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  const res = data?.data?.response;

  const { data: project } = useQuery(
    ['project_list'],
    () => axiosInstance.get(API_URLS?.project_list_dropdown),
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  const project_list = project?.data?.response;

  const { data: employee } = useQuery(
    ['employee_list'],
    () => axiosInstance.get(API_URLS?.employee_list_dropdown),
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  const employee_list = employee?.data?.response;

  return (
    <div className="p-3 md:px-6">
      <CustomCircularProgress isLoading={loding || isLoading} />
      <div className="breadcruumb_section">
        <div className="breadcrumb_content">
          <h3>Create Leads</h3>
          <p>Fill in the lead's details to add them to the pipeline.</p>
        </div>
      </div>
      <div className="card_form">
        <div className='box_mainse'>
          <div className='form_head'>
            <span class="step">1</span>
            <div>
              <h2>Who is the lead?</h2>
              <small>Name and mobile number are enough to save.</small>
            </div>
          </div>
          <div className='form_main_row'>
            <div className='form_input_box'>
              <label for="name">Full name <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20c1-3.6 3.9-5.4 7.5-5.4s6.5 1.8 7.5 5.4" /></svg>
                <TextField
                  fullWidth
                  size="small"
                  id="lead_cust_name"
                  name="lead_cust_name"
                  placeholder="Enter Name"
                  value={fk.values.lead_cust_name}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">Mobile number <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><path d="M6.6 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6 6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" /></svg>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  id="lead_mob_no"
                  name="lead_mob_no"
                  placeholder="Mobile Number"
                  value={fk.values.lead_mob_no}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">Alternate number <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><path d="M6.6 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6 6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" /></svg>
                <TextField
                  fullWidth
                  size="small"
                  id="lead_alter_mob_no"
                  name="lead_alter_mob_no"
                  placeholder="Alternate Mobile No."
                  value={fk.values.lead_alter_mob_no}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">Email <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></svg>
                <TextField
                  fullWidth
                  size="small"
                  id="lead_email"
                  name="lead_email"
                  placeholder="Email"
                  value={fk.values.lead_email}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">Gender <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M8.5 12h7" /></svg>
                <TextField
                  select
                  fullWidth
                  size="small"
                  id="lead_gender"
                  name="lead_gender"
                  value={fk.values.lead_gender}
                  onChange={fk.handleChange}
                >
                  <MenuItem value={'selectgender'}>Select Gender</MenuItem>
                  <MenuItem value={'Male'}>Male</MenuItem>
                  <MenuItem value={'Female'}>Female</MenuItem>
                  <MenuItem value={'Other'}>Other</MenuItem>
                </TextField>
              </div>
            </div>
          </div>
        </div>
        <div className='box_mainse'>
          <div className='form_head'>
            <span class="step">2</span>
            <div>
              <h2>Where are they based?</h2>
              <small>Used to route the lead to the nearest branch.</small>
            </div>
          </div>
          <div className='form_main_row'>
            <div className='form_input_box'>
              <label for="name">City name <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><path d="M4 21V8l6-4v17M14 21V11l6 3v7M4 21h16" /></svg>
                <TextField
                  fullWidth
                  size="small"
                  id="lead_city"
                  name="lead_city"
                  placeholder="City Name"
                  value={fk.values.lead_city}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">State name <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><path d="m9 5 6 2 5-2v12l-5 2-6-2-5 2V7Z" /><path d="M9 5v12M15 7v12" /></svg>
                <TextField
                  fullWidth
                  size="small"
                  id="lead_state"
                  name="lead_state"
                  placeholder="State Name"
                  value={fk.values.lead_state}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">Country name <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5" /></svg>
                <TextField
                  fullWidth
                  size="small"
                  id="lead_country"
                  name="lead_country"
                  placeholder="Country Name"
                  value={fk.values.lead_country}
                  onChange={fk.handleChange}
                />
              </div>
            </div>
          </div>
        </div>
        <div className='box_mainse'>
          <div className='form_head'>
            <span class="step">3</span>
            <div>
              <h2>What are they interested in?</h2>
              <small>This decides which bucket the lead lands in.</small>
            </div>
          </div>
          <div className='form_main_row'>
            <div className='form_input_box'>
              <label for="name">Business vertical <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /></svg>
                <TextField
                select
                fullWidth
                size="small"
                id="lead_business"
                name="lead_business"
                value={fk.values.lead_business}
                onChange={fk.handleChange}
              >
                <MenuItem value={'selectbusiness'}>Select Business</MenuItem>
                <MenuItem value={'MLM'}>MLM</MenuItem>
                <MenuItem value={'REAL ESTATE'}>REAL ESTATE</MenuItem>
              </TextField>
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">Select Products <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>
                <TextField
                select
                fullWidth
                size="small"
                id="lead_project_id"
                name="lead_project_id"
                value={fk.values.lead_project_id}
                onChange={fk.handleChange}
              >
                <MenuItem value={'selectproject'}>Select Product Name</MenuItem>
                {project_list?.map((item) => (
                  <MenuItem key={item?.pro_id} value={item?.pro_id}>
                    {item?.pro_title}
                  </MenuItem>
                ))}
              </TextField>
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">Source Name <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>
                <TextField
                select
                fullWidth
                size="small"
                id="lead_source"
                name="lead_source"
                value={fk.values.lead_source}
                onChange={fk.handleChange}
              >
                <MenuItem value={'selectsource'}>Select Source Name</MenuItem>
                {res?.map((item) => (
                  <MenuItem key={item?.ld_src_id} value={item?.ld_src_id}>
                    {item?.ld_src_name}
                  </MenuItem>
                ))}
              </TextField>
              </div>
            </div>
             <div className='form_input_box'>
              <label for="name">Select Employee <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>
                <TextField
                select
                fullWidth
                size="small"
                id="lead_assign_to"
                name="lead_assign_to"
                value={fk.values.lead_assign_to}
                onChange={fk.handleChange}
              >
                <MenuItem value={'selectemployee'}>Select Employee</MenuItem>
                {employee_list?.map((item) => (
                  <MenuItem key={item?.emp_id} value={item?.emp_id}>
                    {item?.emp_name}
                  </MenuItem>
                ))}
              </TextField>
              </div>
            </div>
            <div className='form_input_box'>
              <label for="name">Select Status <i>*</i></label>
              <div className='form_input'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="8" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                </svg>
                 <TextField
                select
                fullWidth
                size="small"
                id="lead_bkt_status"
                name="lead_bkt_status"
                value={fk.values.lead_bkt_status}
                onChange={fk.handleChange}
              >
                <MenuItem value={'selectstatus'}>Select Status</MenuItem>
                <MenuItem value={'1'}>New</MenuItem>
                <MenuItem value={'2'}>Cold</MenuItem>
                <MenuItem value={'3'}>Warm</MenuItem>
                <MenuItem value={'6'}>Hot</MenuItem>
                <MenuItem value={'4'}>Close</MenuItem>
                <MenuItem value={'5'}>Convert</MenuItem>
              </TextField>
              </div>
            </div>
          </div>
          <div className='form_input_box mt-3'>
            <label for="name">Notes <i>*</i></label>
            <div className='form_input'>
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 12h.01M12 12h.01M17 12h.01" /></svg>
               <TextField
              fullWidth
              size="small"
              id="lead_sort_des"
              name="lead_sort_des"
              placeholder="Remark"
              value={fk.values.lead_sort_des}
              onChange={fk.handleChange}
            />
            </div>
          </div>
        </div>
        <div className="form_footer">
          <span class="note">Saved leads appear in your lead list straight away.</span>
          <div className="flex justify-end gap-2.5">
            <Button className="main_btn_1"
              onClick={() => fk.handleReset()}
              variant="outlined"
              size="small">
              Clear Form
            </Button>
            <Button className="main_btn_2"
              onClick={() => fk.handleSubmit()}
              variant="contained"
              size="small">
              <svg viewBox="0 0 24 24"><path d="M4 12.5 9 17.5 20 6.5"/></svg>
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLead;