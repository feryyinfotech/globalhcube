import { Button, MenuItem, TextField } from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';

// ---- Design tokens (kept consistent with the rest of the admin app) ----
const ACCENT = '#4F46E5';
const INK = '#2857D2';
const MUTED = '#6B7280';
const BORDER = '#E7E7F3';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#fff',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: '#C7CBF7' },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: '1.5px' },
  },
};

const SectionTitle = ({ children }) => (
  <p
    className="text-xs font-bold tracking-wide uppercase mb-4"
    style={{ color: ACCENT }}
  >
    {children}
  </p>
);

const EmpRegistration = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const initialValue = {
    name: '',
    mobile: '',
    email: '',
    sponsor_name: '',
    team_name: '',
    city_name: '',
    state_name: '',
    work_preference: '',
    address: '',
    password: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    onSubmit: () => {
      mutate();
    },
  });

  const { mutate } = useMutation(
    async () => {
      setLoading(true);
      const reqBody = {
        name: fk.values.name,
        mobile: String(fk.values.mobile),
        email: fk.values.email,
        sponsor_name: fk.values.sponsor_name,
        team_name: fk.values.team_name,
        city_name: fk.values.city_name,
        state_name: fk.values.state_name,
        work_preference: fk.values.work_preference,
        address: fk.values.address,
        password: fk.values.password,
      };
      return axiosInstance.post(API_URLS.emp_registration, reqBody);
    },
    {
      onSuccess: (res) => {
        toast(res?.data?.msg);
        if (res?.data?.msg === 'Data Saved Successfully') {
          fk.resetForm();
          navigate('/emply_registration_list');
        }
        setLoading(false);
      },
      onError: () => {
        setLoading(false);
        toast.error('Something went wrong');
      },
    }
  );

  return (
    <>

      <div className="p-3 md:p-6">
        <CustomCircularProgress isLoading={loading} />
        <div className="breadcruumb_section">
          <div className="breadcrumb_content">
            <h3>Employee Registration</h3>
            <p> Fill in the employee's details to create their account.</p>
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
            <div className='form_main_row-2'>
              <div className='form_input_box'>
                <label for="name">Full name <i>*</i></label>
                <div className='form_input'>
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20c1-3.6 3.9-5.4 7.5-5.4s6.5 1.8 7.5 5.4" /></svg>
                  <TextField
                    fullWidth
                    size="small"
                    name="name"
                    placeholder="Enter Name"
                    value={fk.values.name}
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
                    type="text"
                    id="mobile"
                    name="mobile"
                    placeholder="Enter mobile number"
                    value={fk.values.mobile}
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
                    type="email"
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    value={fk.values.email}
                    onChange={fk.handleChange}
                  />
                </div>
              </div>
              <div className='form_input_box'>
                <label for="name">Password <i>*</i></label>
                <div className='form_input'>
                  <svg viewBox="0 0 24 24">
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                    <circle cx="12" cy="15" r="1" />
                    <path d="M12 16v2" />
                  </svg>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    name="password"
                    placeholder='Enter Password'
                    value={fk.values.password}
                    onChange={fk.handleChange}
                  />
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
                <label for="name">Address <i>*</i></label>
                <div className='form_input'>
                  <svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-5h4v5" /></svg>
                  <TextField
                    fullWidth
                    size="small"
                    name="address"
                    placeholder="Enter Address"
                    value={fk.values.address}
                    onChange={fk.handleChange}
                  />
                </div>
              </div>
              <div className='form_input_box'>
                <label for="name">City name <i>*</i></label>
                <div className='form_input'>
                  <svg viewBox="0 0 24 24"><path d="M4 21V8l6-4v17M14 21V11l6 3v7M4 21h16" /></svg>

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="City Name"
                    name="city_name"
                    value={fk.values.city_name}
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
                    placeholder="State Name"
                    name="state_name"
                    value={fk.values.state_name}
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
                <label for="name">Sponsor Name <i>*</i></label>
                <div className='form_input'>
                  <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" /></svg>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Sponsor Name"
                    name="sponsor_name"
                    value={fk.values.sponsor_name}
                    onChange={fk.handleChange}
                  />
                </div>
              </div>
              <div className='form_input_box'>
                <label for="name">Team Name <i>*</i></label>
                <div className='form_input'>
                  <svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Team Name"
                    name="team_name"
                    value={fk.values.team_name}
                    onChange={fk.handleChange}
                  />
                </div>
              </div>
              <div className='form_input_box'>
                <label for="name">Work Preference <i>*</i></label>
                <div className='form_input'>
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    name="work_preference"
                    value={fk.values.work_preference}
                    onChange={fk.handleChange}
                  >

                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="MLM">MLM</MenuItem>
                    <MenuItem value="REAL ESTATE">REAL ESTATE</MenuItem>
                  </TextField>
                </div>
              </div>
            </div>
          </div>
          <div className='form_footer'>
            <span class="note">Saved leads appear in your lead list straight away.</span>
            <div
              className="flex justify-end gap-2.5">
              <Button className="main_btn_1"
                variant="outlined"
                onClick={fk.handleReset}>
                Clear Form
              </Button>
              <Button className="main_btn_2"
                variant="contained"
                onClick={fk.handleSubmit}>
                <svg viewBox="0 0 24 24"><path d="M4 12.5 9 17.5 20 6.5" /></svg> Submit Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmpRegistration;