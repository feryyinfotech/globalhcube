import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PhoneIcon from '@mui/icons-material/Phone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import {
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
} from '@mui/material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import { toLocalMoment as getApptMoment } from '../../utils/dateUtils';
import { Button, Form, Col, Row } from 'react-bootstrap';
import moment from 'moment';
import { useState, useEffect, useMemo, useRef } from 'react';
import EmpChart from './../userpages/EmpChart';
import LeadsChart from './../userpages/LeadsChart';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

// ---- Design tokens (consistent with the rest of the app) ----
const INK = '#1E1B4B';
const MUTED = '#6B7280';
const BORDER = '#E7E7F3';

// Which appointments have already alarmed today is persisted to localStorage
// (date-scoped key) — otherwise a page refresh loses the in-memory ref and
// every overdue appointment alarms again immediately on reload.
const ALARM_STORAGE_KEY_PREFIX = 'emp_dashboard_alarmed_followups_';
const getAlarmStorageKey = () =>
  `${ALARM_STORAGE_KEY_PREFIX}${moment().format('YYYY-MM-DD')}`;

const loadTriggeredAlarms = () => {
  try {
    // Drop any previous day's entries so localStorage doesn't grow forever.
    Object.keys(localStorage)
      .filter(
        (k) =>
          k.startsWith(ALARM_STORAGE_KEY_PREFIX) && k !== getAlarmStorageKey()
      )
      .forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(getAlarmStorageKey());
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
};

const persistTriggeredAlarms = (set) => {
  try {
    localStorage.setItem(getAlarmStorageKey(), JSON.stringify(Array.from(set)));
  } catch (e) {
    // localStorage unavailable (private mode, quota, etc.) — alarms just
    // won't survive a refresh, which is a harmless fallback.
  }
};

const EmpDashboard = () => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [followupPage, setFollowupPage] = useState(1);
  const followupRowsPerPage = 5;
  const [alarmItem, setAlarmItem] = useState(null);
  const triggeredAlarmsRef = useRef(loadTriggeredAlarms());
  const alarmBeepIntervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const { isLoading, data: count_info } = useQuery(
    ['get_dashboard_data_emp'],
    () => axiosInstance.get(API_URLS?.get_dashboard_data_emp),
    {
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    }
  );

  // Backend now returns a single row: { new_cnt, cold_cnt, warm_cnt,
  // close_cnt, convert_cnt, hot_cnt, out_dated_evnt_cnt, ignored_cnt }
  const stats = count_info?.data?.response?.[0] || {};

  const newCnt = Number(stats.new_cnt) || 0;
  const coldCnt = Number(stats.cold_cnt) || 0;
  const warmCnt = Number(stats.warm_cnt) || 0;
  const hotCnt = Number(stats.hot_cnt) || 0;
  const closeCnt = Number(stats.close_cnt) || 0;
  const convertCnt = Number(stats.convert_cnt) || 0;
  const totalCnt = newCnt + coldCnt + warmCnt + hotCnt + closeCnt + convertCnt;

  const { data: pendingFollowupsData } = useQuery(
    ['todays_pending_followups_emp'],
    () => axiosInstance.get(API_URLS.todays_pending_followups_emp),
    { refetchOnWindowFocus: false, refetchInterval: 30000 }
  );
  const pendingFollowups = pendingFollowupsData?.data?.response || [];

  const followupTotalPage = Math.max(
    Math.ceil(pendingFollowups.length / followupRowsPerPage),
    1
  );
  const followupCurrentPage = Math.min(followupPage, followupTotalPage);
  const pagedFollowups = pendingFollowups.slice(
    (followupCurrentPage - 1) * followupRowsPerPage,
    followupCurrentPage * followupRowsPerPage
  );

  const { data: weeklyTrendData } = useQuery(
    ['weekly_lead_trend_emp'],
    () => axiosInstance.get(API_URLS.weekly_lead_trend_emp),
    { refetchOnWindowFocus: false }
  );
  const weeklyTrendRows = weeklyTrendData?.data?.response || [];

  // Backend only returns weeks that actually have leads — fill in the full
  // last-8-weeks range (0s for weeks with no activity) so the chart always
  // shows a continuous 8-point line. yw (YYYYWW, ISO week) is the join key
  // between the two, matching MySQL's YEARWEEK(date, 1) output format.
  const chartData = useMemo(() => {
    const byYw = weeklyTrendRows.reduce((acc, row) => {
      acc[row.yw] = row;
      return acc;
    }, {});
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekMoment = moment().subtract(i, 'weeks');
      const yw = Number(weekMoment.format('GGGGWW'));
      const row = byYw[yw];
      weeks.push({
        week: `W${weekMoment.isoWeek()}`,
        leads: row ? Number(row.leads_cnt) : 0,
        converted: row ? Number(row.converted_cnt) : 0,
      });
    }
    return weeks;
  }, [weeklyTrendRows]);
  const latestWeek = chartData[chartData.length - 1];
  const peakWeek = chartData.reduce(
    (max, w) => (w.leads > max.leads ? w : max),
    chartData[0] || { week: '', leads: 0 }
  );

  // pendingFollowups is a fresh array reference on every render (derived from
  // the query result), so it's mirrored into a ref rather than depended on
  // directly — otherwise the ticking interval below would tear down and
  // restart on every render instead of just ticking every 5s.
  const pendingFollowupsRef = useRef(pendingFollowups);
  useEffect(() => {
    pendingFollowupsRef.current = pendingFollowups;
  }, [pendingFollowups]);

  // Watches the pending list and fires an alarm the moment an appointment's
  // scheduled time arrives — one alarm at a time, each entry only ever
  // triggers once (tracked in triggeredAlarmsRef) so it doesn't re-fire every
  // tick while waiting for a previous alarm to be dismissed.
  useEffect(() => {
    const timer = setInterval(() => {
      if (alarmItem) return;
      const now = moment();
      const due = pendingFollowupsRef.current.find((p) => {
        if (!p.follow_next_appointment_date) return false;
        const key = `${p.lead_id}-${p.follow_next_appointment_date}`;
        if (triggeredAlarmsRef.current.has(key)) return false;
        return now.isSameOrAfter(getApptMoment(p.follow_next_appointment_date));
      });
      if (due) {
        triggeredAlarmsRef.current.add(
          `${due.lead_id}-${due.follow_next_appointment_date}`
        );
        persistTriggeredAlarms(triggeredAlarmsRef.current);
        setAlarmItem(due);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [alarmItem]);

  const playAlarmBeep = () => {
    try {
      const ctx =
        audioCtxRef.current ||
        (audioCtxRef.current = new (window.AudioContext ||
          window.webkitAudioContext)());
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Web Audio unavailable/blocked — the visual alarm dialog still shows.
    }
  };

  // Sound loops for as long as the dialog is open — cleared only when the
  // employee dismisses it via the OK button (dismissAlarm below).
  useEffect(() => {
    if (alarmItem) {
      playAlarmBeep();
      alarmBeepIntervalRef.current = setInterval(playAlarmBeep, 900);
    }
    return () => clearInterval(alarmBeepIntervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmItem]);

  const dismissAlarm = () => {
    clearInterval(alarmBeepIntervalRef.current);
    setAlarmItem(null);
  };

  // Each stat is its own visually distinct card
  const cards = [
    {
      label: 'Total Leads',
      count: totalCnt,
      status: 'ALL',
      icon: (
        <svg viewBox="0 0 24 24" stroke="#0F52B5">
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 19c.9-3.2 3.2-4.8 6-4.8s5.1 1.6 6 4.8" />
          <path d="M17 8h5M19.5 5.5v5" />
        </svg>
      ),
      accent: '#4F46E5',
      soft: '#EEF0FF',
      trend: '+8.2%',
      trendType: 'up',
    },
    {
      label: 'New Leads',
      count: newCnt,
      status: 'New',
      icon: (
        <svg viewBox="0 0 24 24" stroke="#0E8F6F">
          <path d="M3 17l5.5-6 4 3.5L21 6" />
          <path d="M15 6h6v6" />
        </svg>
      ),
      accent: '#2563EB',
      soft: '#E4F6F0',
      trend: '+14 today',
      trendType: 'up',
    },
    {
      label: 'Cold Leads',
      count: coldCnt,
      status: 'Cold',
      icon: <AcUnitIcon sx={{ fontSize: 26 }} />,
      accent: '#0891B2',
      soft: '#E5FAFE',
      trend: '-2.5%',
      trendType: 'down',
    },
    {
      label: 'Warm Leads',
      count: warmCnt,
      status: 'Warm',
      icon: <DeviceThermostatIcon sx={{ fontSize: 26 }} />,
      accent: '#D97706',
      soft: '#FEF3E2',
      trend: '-3.5%',
      trendType: 'down',
    },
    {
      label: 'Hot Leads',
      count: hotCnt,
      status: 'Hot',
      icon: <LocalFireDepartmentIcon sx={{ fontSize: 26 }} />,
      accent: '#DC2626',
      soft: '#FEECEC',
      trend: '+4.2%',
      trendType: 'up',
    },
    {
      label: 'Close Leads',
      count: closeCnt,
      status: 'Close',
      icon: <CheckCircleIcon sx={{ fontSize: 26 }} />,
      accent: '#475569',
      soft: '#F1F5F9',
      trend: '+7.3%',
      trendType: 'up',
    },
    {
      label: 'Convert Leads',
      count: convertCnt,
      status: 'Convert',
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 26 }} />,
      accent: '#15803D',
      soft: '#E7F8ED',
      trend: '-3.5%',
      trendType: 'down',
    },
  ];

  return (
    <>
      <CustomCircularProgress isLoading={isLoading} />
      <div className="p-3 md:p-6">
        <div className="breadcruumb_section">
          <div className="breadcrumb_content">
            <h3>Dashboard</h3>
            <p>Welcome to Global-H-Cube Services Lead Management Software</p>
          </div>
          <div className="breadcrumb_serch">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <Form.Control
              type="text"
              placeholder="Search leads, phone, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button onClick={() => navigate("/employee-create-lead")}>
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Lead
            </Button>
          </div>
        </div>

        <div className="grid xl:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3 mb-6">
          {cards.map((card) => (
            <div key={card.label} className="main_card">
              <div className="flex items-center justify-between">
                <div
                  className="card_icon"
                  style={{
                    backgroundColor: card.soft,
                    color: card.accent,
                  }}
                >
                  {card.icon}
                </div>

                <span className={`trend ${card.trendType}`}>
                  {card.trendType === 'up' ? '' : ''} {card.trend}
                </span>
              </div>
              <h4> {card.count}</h4>
              <p>{card.label}</p>
            </div>
          ))}
        </div>

        <Row>
          <Col xl={8} lg={8} md={8}>
            <div className="card_chart">
              <div className="headsse">
                <div>
                  <h5>Lead flow, last 8 weeks</h5>
                  <p>New leads captured against leads converted.</p>
                </div>
                <span>
                  {latestWeek?.week} · {latestWeek?.leads} new
                </span>
              </div>
              <div className="chart_body">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E7BEF" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2E7BEF" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid stroke="#E6EEF8" vertical={false} />

                    <XAxis
                      dataKey="week"
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      domain={[0, 'auto']}
                      allowDecimals={false}
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="leads"
                      stroke="#2E7BEF"
                      strokeWidth={3}
                      fill="url(#leadFill)"
                      dot={{
                        r: 4,
                        stroke: '#2E7BEF',
                        strokeWidth: 2,
                        fill: '#fff',
                      }}
                      activeDot={{
                        r: 6,
                        fill: '#2E7BEF',
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="converted"
                      stroke="#0E8F6F"
                      strokeWidth={2.5}
                      strokeDasharray="6 6"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="chart-footer">
                  <div className="legend">
                    <span className="blue"></span> New leads
                  </div>

                  <div className="legend">
                    <span className="green"></span> Converted
                  </div>

                  <div className="peak">
                    Peak week: <strong>{peakWeek?.week}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Col>
          <Col xl={4} lg={4} md={4} className='mt-3 mt-md-0'>
            <EmpChart
              stats={{ newCnt, coldCnt, warmCnt, hotCnt, closeCnt, convertCnt }}
            />
          </Col>
        </Row>

        {/* Secondary panels */}
        <Row>
          <Col xl={4} lg={4} md={4} className='mt-3 mt-md-4'>
            {/* Bucket status breakdown */}
            <div className="card_chart">
              <div className="headsse">
                <div>
                  <h5>Bucket Status Breakdown</h5>
                  <p>Share of the pipeline by stage.</p>
                </div>
              </div>
              <div className="chart_body scroll_height">
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'New', value: newCnt, color: '#2563EB' },
                    { label: 'Cold', value: coldCnt, color: '#0891B2' },
                    { label: 'Warm', value: warmCnt, color: '#D97706' },
                    { label: 'Hot', value: hotCnt, color: '#DC2626' },
                    { label: 'Close', value: closeCnt, color: '#475569' },
                    { label: 'Convert', value: convertCnt, color: '#15803D' },
                  ].map((row) => {
                    const pct =
                      totalCnt > 0 ? Math.round((row.value / totalCnt) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold" style={{ color: INK }}>
                            {row.label}
                          </span>
                          <span style={{ color: MUTED }}>
                            {row.value} ({pct}%)
                          </span>
                        </div>
                        <div
                          className="w-full rounded-full h-2"
                          style={{ backgroundColor: '#F1F1F8' }}
                        >
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: row.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Col>
          <Col xl={4} lg={4} md={4} className='mt-3 mt-md-4'>
            <div className="card_chart">
              <div className="headsse">
                <div>
                  <h5>Pending Follow-ups</h5>
                  <p>Leads with a follow-up scheduled for today.</p>
                </div>
              </div>

              {pendingFollowups.length > 0 ? (
                <>
                  <div className="colling_row scroll_height">
                    {pagedFollowups.map((p) => {
                      const apptMoment = p.follow_next_appointment_date
                        ? getApptMoment(p.follow_next_appointment_date)
                        : null;
                      const isDue = apptMoment
                        ? moment().isSameOrAfter(apptMoment)
                        : false;
                      return (
                        <div
                          key={p.lead_id}
                          className="colling_list">
                          <span className='calling_time'>
                              {apptMoment ? `  ${apptMoment.format('hh:mm A')}` : ''}
                          </span>
                          <div>
                            <b>{p.lead_cust_name || 'N/A'} {isDue && (
                                <span
                                  className=""
                                  style={{ backgroundColor: '#DC2626', color: '#fff' }}
                                >
                                  DUE
                                </span>
                              )}</b>
                            <p><span>{p.follow_type}</span></p>
                          </div>
                          
                          {p.follow_type === 'Calling' && p.lead_mob_no && (
                            <a
                              href={`tel:${p.lead_mob_no}`}
                              className="Phone_icons">
                              <PhoneIcon sx={{ fontSize: 18 }} />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {followupTotalPage > 1 && (
                    <div className="mt-3">
                      <CustomToPagination
                        setPage={setFollowupPage}
                        page={followupCurrentPage}
                        data={{ totalPage: followupTotalPage, currPage: followupCurrentPage }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="colling_list">
                  <span
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: '#FEECEC',
                      color: '#DC2626',
                    }}
                  >
                    <EventBusyIcon sx={{ fontSize: 28 }} />
                  </span>
                  <div>
                    <b>0</b>
                    <p><span>follow-ups due today</span></p>
                  </div>
                </div>
              )}
            </div>
          </Col>
           <Col xl={4} lg={4} md={4} className='mt-3 mt-md-4'>
              <LeadsChart />
           </Col>
        </Row>
      </div>

      <Dialog
        open={!!alarmItem}
        onClose={() => {}}
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogContent>
          <div className="flex flex-col items-center gap-3 py-2 px-4 min-w-[260px]">
            <span
              className="flex items-center justify-center rounded-full animate-pulse"
              style={{ width: 64, height: 64, backgroundColor: '#FEECEC', color: '#DC2626' }}
            >
              <NotificationsActiveIcon sx={{ fontSize: 34 }} />
            </span>
            <p className="text-lg font-bold text-center" style={{ color: INK }}>
              Follow-up Reminder
            </p>
            <p className="text-sm text-center" style={{ color: MUTED }}>
              {alarmItem?.lead_cust_name || 'Lead'} — {alarmItem?.follow_type}
            </p>
            {alarmItem?.follow_next_appointment_date && (
              <p className="text-xs text-center" style={{ color: MUTED }}>
                Scheduled at{' '}
                {getApptMoment(alarmItem.follow_next_appointment_date).format(
                  'hh:mm A'
                )}
              </p>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          {alarmItem?.follow_type === 'Calling' && alarmItem?.lead_mob_no && (
            <MuiButton
              variant="outlined"
              color="success"
              startIcon={<PhoneIcon />}
              href={`tel:${alarmItem.lead_mob_no}`}
            >
              Call Now
            </MuiButton>
          )}
          <MuiButton
            variant="contained"
            onClick={dismissAlarm}
            sx={{ backgroundColor: '#4F46E5' }}
          >
            OK
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmpDashboard;
