import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import { IconButton, MenuItem, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import { toLocalMoment } from '../../utils/dateUtils';
import { Col, Row } from 'react-bootstrap';
import React from "react";

const ACCENT = '#4F46E5';
const INK = '#1E1B4B';
const MUTED = '#6B7280';
const BORDER = '#E7E7F3';

const statusColors = {
  New: 'bg-green-100 text-green-800',
  Cold: 'bg-blue-100 text-blue-700',
  Warm: 'bg-orange-100 text-orange-800',
  Hot: 'bg-pink-100 text-pink-700',
  Close: 'bg-red-100 text-red-600',
  Convert: 'bg-teal-100 text-teal-800',
};

const MEETING_MODES = ['In-person', 'Video Call'];

// "Next Appointment" is the umbrella category — picking it reveals a
// sub-type dropdown built from these 4 follow_up_types rows (matched by
// slug, not title). Titles get edited from the Master page from time to
// time, so hardcoding the title string here as the saved follow_type value
// would drift out of sync with the DB and silently break the visit-fields
// detection below — slugs are far more stable.
const NEXT_APPOINTMENT_SLUGS = ['calling', 'bop', 'site-visit', 'office-meeting'];

// The three top-level choices in the "Follow-up Type" dropdown. Lead Close /
// Sale Done map 1:1 onto their own follow_up_types rows and only ever need a
// remark; Next Appointment reveals the sub-type dropdown above.
const CATEGORY_OPTIONS = [
  { label: 'Next Appointment', value: 'next_appointment' },
  { label: 'Lead Close', value: 'lead_close' },
  { label: 'Sale Done', value: 'sale_done' },
];
const CATEGORY_TO_FOLLOW_TYPE = {
  lead_close: 'Lead Close',
  sale_done: 'Sale Done',
};

// Independent "Status" field — a fixed, permanent set of outcome labels,
// separate from the Next Appointment / Lead Close / Sale Done flow above.
// Only shown for the Next Appointment flow (Lead Close / Sale Done stay
// remark-only per spec).
const FOLLOW_STATUS_OPTIONS = [
  'Site Visit Done',
  'Office Group BOP Done',
  'Office One to One BOP Done',
  'Plot Meeting Done',
  'Online BOP Done',
];

const emptyFollowupForm = {
  category: '',
  follow_type: '',
  follow_status: '',
  next_appointment_date: '',
  location: '',
  meeting_mode: '',
  duration: '',
  remark: '',
};

const EmpLeadFollowup = () => {
  const { lead_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const client = useQueryClient();
  const timelineEndRef = useRef(null);
  const lead = location.state?.lead;

  const [followupForm, setFollowupForm] = useState(emptyFollowupForm);

  const { data: followupTypesData } = useQuery(
    ['followup_types_emp'],
    () => axiosInstance.get(API_URLS.followup_types_emp),
    { refetchOnWindowFocus: false }
  );
  const followupTypes = followupTypesData?.data?.response || [];
  const visitTypes = followupTypes
    .filter((t) => t.flw_typ_is_visit)
    .map((t) => t.flw_typ_title);
  // Same live rows power the dropdown label/value — so the saved follow_type
  // always matches a real follow_up_types title, whatever it currently is.
  const nextAppointmentSubtypes = NEXT_APPOINTMENT_SLUGS.map((slug) =>
    followupTypes.find((t) => t.flw_typ_slug === slug)
  )
    .filter(Boolean)
    .map((t) => ({ label: t.flw_typ_title.trim(), value: t.flw_typ_title }));

  const { data: followupsData, isLoading: isFollowupsLoading } = useQuery(
    ['emp_lead_followups', lead_id],
    () =>
      axiosInstance.post(API_URLS.get_lead_followups_emp, {
        lead_id,
      }),
    { enabled: !!lead_id }
  );
   const followups = [...(followupsData?.data?.response || [])].reverse();

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [followups.length]);

  const { mutate: sendFollowup, isLoading: isSending } = useMutation(
    (form) =>
      axiosInstance.post(API_URLS.add_lead_followup_emp, {
        lead_id,
        follow_type: form.follow_type,
        follow_status: form.follow_status,
        remark: form.remark,
        calling_done: '',
        next_appointment_date: form.next_appointment_date || '',
        location: visitTypes.includes(form.follow_type) ? form.location : '',
        meeting_mode: visitTypes.includes(form.follow_type)
          ? form.meeting_mode
          : '',
        duration: visitTypes.includes(form.follow_type) ? form.duration : '',
      }),
    {
      onSuccess: (res) => {
        if (res?.data?.success) {
          setFollowupForm(emptyFollowupForm);
          client.refetchQueries(['emp_lead_followups', lead_id]);
          client.refetchQueries(['emp_update_follow_leads']);
        } else {
          toast(res?.data?.msg || 'Failed to save follow-up');
        }
      },
      onError: () => {
        toast.error('Failed to save follow-up');
      },
    }
  );

  const handleSubmitFollowup = () => {
    if (!followupForm.category) {
      toast('Please select a follow-up type');
      return;
    }
    if (followupForm.category === 'next_appointment') {
      if (!followupForm.follow_type) {
        toast('Please select a follow-up sub-type');
        return;
      }
      if (!followupForm.next_appointment_date) {
        toast('Please pick the next appointment date & time');
        return;
      }
    }
    if (!followupForm.remark.trim()) {
      toast('Remark is required');
      return;
    }
    sendFollowup(followupForm);
  };

  return (
    <div className="p-3 md:p-6 ">
      <CustomCircularProgress isLoading={isSending} />

      <button
        onClick={() => navigate('/employee-update-follow')}
        className="flex items-center gap-1 text-sm font-semibold mb-4"
        style={{ color: INK }}
      >
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Back to leads
      </button>

      <div className='use_follow_card'>
        <div className='use_follow_top'>
          <div>
            <h3>{lead?.lead_cust_name || 'Lead'}</h3>
            <ul>
              <li>#{lead?.lead_unique_id || lead_id}</li>
              <li>{lead?.lead_mob_no ? ` · ${lead.lead_mob_no}` : ''}</li>
            </ul>
          </div>
          {lead?.ld_bkt_status && (
              <span
                className={` ${
                  statusColors[lead.ld_bkt_status] || ''
                }`}
              >
                {lead.ld_bkt_status}
              </span>
            )}
        </div>
        <div className='list_follow_us'>
          <ul>
            <li>
              <p>Source</p>
              <span>{lead?.ld_src_name || 'N/A'}</span>
            </li>
            <li>
              <p>Project</p>
              <span>{lead?.project_details?.pro_title || 'N/A'}</span>
            </li>
            <li>
              <p>Enquired</p>
              <span>{' '}
              {lead?.lead_created_at
                ? toLocalMoment(lead.lead_created_at).format('D MMM YY, hh:mm A')
                : 'N/A'}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl  overflow-hidden mt-4" >
        


        {lead?.lead_sort_des && (
          <div className="px-5 py-3 border-b bg-gray-50" style={{ borderColor: BORDER }}>
            <p className="text-[11px] font-bold uppercase" style={{ color: MUTED }}>
              Remark
            </p>
            <p className="text-sm" style={{ color: INK }}>
              {lead.lead_sort_des}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 marin_res" >
          {isFollowupsLoading ? (
            <p className="text-center text-sm" style={{ color: MUTED }}>
              Loading...
            </p>
          ) : followups.length > 0 ? (
            followups.map((f) => (
              <div
                key={f.follow_id}
                className="cards_bubble">
                  <div class="node"><svg viewBox="0 0 24 24"><path d="M4 5h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 14l5 2v4H4z"></path></svg></div>
                <div className="flex items-center justify-between gap-2 flex-wrap bhead_bubble">
                  <span className="buble_type">{f.follow_type} </span>
                  <span className="date_bubble">
                    {toLocalMoment(f.follow_created_at).format('D MMM YY, hh:mm A')}
                  </span>
                </div>
                {f.follow_status && (
                  <span className="buble_type" style={{ marginTop: 4, display: 'inline-block' }}>
                    Status: {f.follow_status}
                  </span>
                )}
                <p className="remark_text">
                  {f.follow_remark}
                </p>
                <div className='bfoot_bubble'>
                  {(f.follow_location ||
                      f.follow_meeting_mode ||
                      f.follow_duration) && (
                  <div className='connect_time'>
                    <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
                    
                      <p >
                        {[f.follow_location, f.follow_meeting_mode, f.follow_duration]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                  </div>
                    )}
                  <div className='next_apointment'>
                     {f.follow_next_appointment_date && (
                      <p >
                        Next:{' '}
                        {toLocalMoment(f.follow_next_appointment_date).format(
                          'D MMM YY, hh:mm A'
                        )}
                      </p>
                    )}
                  </div>
                     {f.follow_type === 'Calling' && f.follow_calling_done !== null && (
                    <div className='connect_time'>
                      <p>
                        Calling Done: {f.follow_calling_done ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
                 
              </div>
            ))
          ) : (
            <p className="text-center text-sm py-4" style={{ color: MUTED }}>
              No follow-ups yet. Add the first one below.
            </p>
          )}
          <div ref={timelineEndRef} />
        </div>

        <div className="card_chart">
          <div class="headsse">
            <div>
              <h5>Log an update</h5>
              <p>Record what happened and set the next touchpoint so the lead never goes quiet.</p>
            </div>
          </div>
            <div className='main_lose'>
              <Row>
                 <Col xl={4} lg={4} md={6} className='mt-3'>
                  <div className='form_input_box'>
                    <label>Status</label>
                    <div className='form_input'>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={followupForm.follow_status}
                        onChange={(e) =>
                          setFollowupForm((prev) => ({
                            ...prev,
                            follow_status: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="">Select Status</MenuItem>
                        {FOLLOW_STATUS_OPTIONS.map((s) => (
                          <MenuItem key={s} value={s}>
                            {s}
                          </MenuItem>
                        ))}
                      </TextField>
                    </div>
                  </div>
                </Col>
                <Col xl={4} lg={4} md={6} className='mt-3'>
                  <div className='form_input_box'>
                    <label for="name">Follow-up Type <i>*</i></label>
                    <div className='form_input'>
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 6h8"/>
                        <path d="M8 12h8"/>
                        <path d="M8 18h5"/>
                        <circle cx="5" cy="6" r="1"/>
                        <circle cx="5" cy="12" r="1"/>
                        <circle cx="5" cy="18" r="1"/>
                      </svg>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        value={followupForm.category}
                        onChange={(e) => {
                          const category = e.target.value;
                          setFollowupForm((prev) => ({
                            ...emptyFollowupForm,
                            category,
                            follow_type: CATEGORY_TO_FOLLOW_TYPE[category] || '',
                            // Status is independent of the category flow, so
                            // switching category shouldn't clear it.
                            follow_status: prev.follow_status,
                          }));
                        }}
                      >
                        <MenuItem value="" disabled>
                          Select Follow-up Type
                        </MenuItem>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </div>
                  </div>
                </Col>
                {followupForm.category === 'next_appointment' && (
                  <Col xl={4} lg={4} md={6} className='mt-3'>
                    <div className='form_input_box'>
                      <label>Type <i>*</i></label>
                      <div className='form_input'>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M8 6h8"/>
                          <path d="M8 12h8"/>
                          <path d="M8 18h5"/>
                          <circle cx="5" cy="6" r="1"/>
                          <circle cx="5" cy="12" r="1"/>
                          <circle cx="5" cy="18" r="1"/>
                        </svg>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={followupForm.follow_type}
                          onChange={(e) =>
                            setFollowupForm((prev) => ({
                              ...prev,
                              follow_type: e.target.value,
                              location: '',
                              meeting_mode: '',
                              duration: '',
                              next_appointment_date: '',
                            }))
                          }
                        >
                          <MenuItem value="" disabled>
                            Select Type
                          </MenuItem>
                          {nextAppointmentSubtypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </div>
                    </div>
                  </Col>
                )}
               
                 {/* {visitTypes.includes(followupForm.follow_type) && (
                  <React.Fragment>
                  <Col xl={4} lg={4} md={6} className='mt-3'>
                    <div className="form_input_box">
                      <label>Location <i>*</i> </label>
                      <div className="form_input">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 21s-6-5.33-6-11a6 6 0 1 1 12 0c0 5.67-6 11-6 11z"/>
                        <circle cx="12" cy="10" r="2.5"/>
                      </svg>
                      <TextField
                          size="small"
                          placeholder="Location"
                          value={followupForm.location}
                          onChange={(e) =>
                            setFollowupForm((prev) => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </Col>
                  <Col xl={4} lg={4} md={6} className='mt-3'>
                    <div className="form_input_box">
                      <label>Meeting Mode <i>*</i> </label>
                      <div className="form_input">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="9" cy="8" r="3"/>
                          <circle cx="17" cy="10" r="2.5"/>
                          <path d="M4 19c0-3 2.5-5 5-5s5 2 5 5"/>
                          <path d="M14 19c0-2 1.5-3.5 3.5-3.5S21 17 21 19"/>
                        </svg>
                          <TextField
                              select
                              size="small"
                              fullWidth
                              value={followupForm.meeting_mode}
                              onChange={(e) =>
                                setFollowupForm((prev) => ({
                                  ...prev,
                                  meeting_mode: e.target.value,
                                }))
                              }
                            >
                              {MEETING_MODES.map((mode) => (
                                <MenuItem key={mode} value={mode}>
                                  {mode}
                                </MenuItem>
                              ))}
                          </TextField>
                      </div>
                    </div>
                  </Col>
                  <Col xl={4} lg={4} md={6} className='mt-3'>
                    <div className="form_input_box">
                      <label>Duration <i>*</i> </label>
                      <div className="form_input">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="9"/>
                          <path d="M12 7v5l3 2"/>
                        </svg>
                       <TextField
                        size="small"
                        placeholder="e.g. 30 min"
                        value={followupForm.duration}
                        onChange={(e) =>
                          setFollowupForm((prev) => ({
                            ...prev,
                            duration: e.target.value,
                          }))
                        }
                      />
                      </div>
                    </div>
                  </Col>
                </React.Fragment>
                )} */}
                {followupForm.category === 'next_appointment' && followupForm.follow_type && (
                  <Col xl={4} lg={4} md={6} className='mt-3'>
                    <div className="form_input_box">
                      <label>Next Appointment <i>*</i> </label>
                      <div className="form_input">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="5" width="18" height="16" rx="2"/>
                          <path d="M8 3v4M16 3v4M3 9h18"/>
                          <circle cx="12" cy="15" r="2"/>
                        </svg>
                        <TextField
                          size="small"
                          type="datetime-local"
                          InputLabelProps={{ shrink: true }}
                          value={followupForm.next_appointment_date}
                          onChange={(e) =>
                            setFollowupForm((prev) => ({
                              ...prev,
                              next_appointment_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </Col>
                )}
                <Col xl={12} className='mt-3'>
                 <div className="form_input_box">
                    <label>Notes <i>*</i> </label>
                    <div className="form_input">
                    <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M7 12h.01M12 12h.01M17 12h.01"></path></svg>
                      <TextField
                          fullWidth
                          size="small"
                          placeholder="Remark (required)..."
                          value={followupForm.remark}
                          onChange={(e) =>
                            setFollowupForm((prev) => ({ ...prev, remark: e.target.value }))
                          }
                        />
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
            <div className='form_footer'>
              <span class="note">Saved leads appear in your lead list straight away.</span>
              <div className="flex justify-end gap-2.5">
                  <IconButton
                    onClick={handleSubmitFollowup}
                    disabled={isSending} className="main_btn_2">
                    <SendIcon fontSize="small" />
                    Save Update
                  </IconButton>
                </div>
            </div>
         
         
         
          
          
        </div>
      </div>
    </div>
  );
};

export default EmpLeadFollowup;
