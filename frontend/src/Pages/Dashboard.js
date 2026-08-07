import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import SportsVolleyballIcon from '@mui/icons-material/SportsVolleyball';
import { CircularProgress, Switch, TextField } from '@mui/material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { API_URLS } from '../config/APIUrls';
import axiosInstance from '../config/axios';
import { FaChevronDown } from 'react-icons/fa';
import { FaCloudArrowDown } from 'react-icons/fa6';
import { MdOutlineHeadsetMic } from 'react-icons/md';
import { IoCallOutline } from 'react-icons/io5';
import { FaDesktop } from 'react-icons/fa';
import CustomTable from '../Shared/CustomTable';
import { useState } from 'react';
import CustomToPagination from '../Shared/CustomToPagination';
import CustomCircularProgress from '../Shared/loder/CustomCircularProgress';
import { Col, Container } from 'react-bootstrap';
import { Row } from 'react-bootstrap';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const { isLoading, data: count_info } = useQuery(
    ['admin_dashboard_bucket_count'],
    () => axiosInstance.get(API_URLS?.admin_count),
    {
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    }
  );
  const count_info_data = count_info?.data?.response || [];
  // console.log(count_info_data);

  const { ploading, data: employee_status } = useQuery(
    ['list'],
    () => axiosInstance.get(API_URLS?.get_employee_list),
    {
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    }
  );
  const employee_list = employee_status?.data?.response?.data;

  const { loding, data: employee_details } = useQuery(
    ['all_employee_details', searchText, page, rowsPerPage],
    () => {
      const reqBody = {
        search: searchText,
        start_date: '',
        end_date: '',
      };
      const response = axiosInstance.post(API_URLS.get_allemployee_data, {
        ...reqBody,
        page: page,
        count: rowsPerPage,
      });

      return response;
    },
    {
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    }
  );
  const result = employee_details?.data?.response?.data;

  const data = [
    {
      id: 1,
      item: 'Total Leads',
      icon: <PersonPinIcon className="!h-[3rem] !w-[3rem] !text-[#2a2785]" />,
      count:
        count_info_data?.find((i) => i?.ld_bkt_status === 'Total Leads')?.cnt ||
        0,
      status: 'ALL',
    },
    {
      id: 2,
      item: 'New ',
      icon: (
        <SportsKabaddiIcon className="!h-[3rem] !w-[3rem] !text-[#2a2785]" />
      ),
      count:
        count_info_data?.find((i) => i?.ld_bkt_status === 'New')?.cnt || 0,
      status: 'New',
    },
    {
      id: 3,
      item: 'Cold ',
      icon: (
        <SportsVolleyballIcon className="!h-[3rem] !w-[3rem] !text-[#2a2785]" />
      ),
      count:
        count_info_data?.find((i) => i?.ld_bkt_status === 'Cold')?.cnt || 0,
      status: 'Cold',
    },
    {
      id: 4,
      item: 'Warm ',
      icon: (
        <SportsKabaddiIcon className="!h-[3rem] !w-[3rem] !text-[#2a2785]" />
      ),
      count:
        count_info_data?.find((i) => i?.ld_bkt_status === 'Warm')?.cnt || 0,
      status: 'Warm',
    },
    {
      id: 5,
      item: 'Hot ',
      icon: <PersonPinIcon className="!h-[3rem] !w-[3rem] !text-[#2a2785]" />,
      count:
        count_info_data?.find((i) => i?.ld_bkt_status === 'Hot')?.cnt || 0,
      status: 'Hot',
    },
    {
      id: 6,
      item: 'Close ',
      icon: (
        <PersonPinCircleIcon className="!h-[3rem] !w-[3rem] !text-[#2a2785]" />
      ),
      count:
        count_info_data?.find((i) => i?.ld_bkt_status === 'Close')?.cnt || 0,
      status: 'Close',
    },
    {
      id: 7,
      item: 'Convert ',
      icon: (
        <AccountBalanceWalletIcon className="!h-[3rem] !w-[3rem] !text-[#2a2785]" />
      ),
      count:
        count_info_data?.find((i) => i?.ld_bkt_status === 'Convert')?.cnt || 0,
      status: 'Convert',
    },
  ];
  if (isLoading)
    return (
      <div className="w-[100%] h-[100%] flex justify-center items-center">
        <CircularProgress isLoading={isLoading} />
      </div>
    );
  const tablehead = [
    <span>Employee Id</span>,
    <span>Username</span>,
    <span>Mobile Number</span>,
    <span>New</span>,
    <span>Cold</span>,
    <span>Warm</span>,
    <span>Hot</span>,
    <span>Close</span>,
    <span>Convert</span>,
  ];

  const tablerow = result?.map((i, index) => {
    return [
      <span>{i?.emp_unique_id || "--"}</span>,
      <span>{i?.emp_name || "--"}</span>,
      <span>{i?.emp_mobile || "--"}</span>,
      <span>{i?.bucket_count?.new_cnt || 0}</span>,
      <span>{i?.bucket_count?.cold_cnt || 0}</span>,
      <span>{i?.bucket_count?.warm_cnt || 0}</span>,
      <span>{i?.bucket_count?.hot_cnt || 0}</span>,
      <span>{i?.bucket_count?.close_cnt || 0}</span>,
      <span>{i?.bucket_count?.convert_cnt || 0}</span>,
    ];
  });
  return (
    <>
      <CustomCircularProgress isLoading={isLoading || loding || ploading} />
      <div className="flex flex-col p-3">
        <div className="overview mt-3">
          <div className="ov-item">
            <div className="ov-label">Total Leads (All Time)</div>
            <div className="ov-value">
              {count_info_data?.find(
                (i) => i?.ld_bkt_status === "Total Leads"
              )?.cnt || 0}
              <span>Total Records</span>
            </div>
          </div>

          <div className="ov-item">
            <div className="ov-label">New Leads</div>
            <div className="ov-value">
              {count_info_data?.find(
                (i) => i?.ld_bkt_status === "New"
              )?.cnt || 0}
              <span>Current Leads</span>
            </div>
          </div>

          <div className="ov-item">
            <div className="ov-label">Overall Conversion</div>
            <div className="ov-value">
              {count_info_data?.find(
                (i) => i?.ld_bkt_status === "Convert"
              )?.cnt || 0}
              <span>Converted Leads</span>
            </div>
          </div>

          <div className="ov-item">
            <div className="ov-label">Leads Closed Today</div>
            <div className="ov-value">
              {employee_list?.todayCloseCount || 0}
              <span>Today's Closed</span>
            </div>
          </div>
        </div>
        <Row>
          <Col xl={4} lg={4} className='mt-3 mt-md-0'>
              <div className='panel_admin'>
                <h3>New Leads</h3>
                <div class="stat-pair">
                  <div class="st blue_text">
                    <div class="val"> {count_info_data?.find((i) => i?.ld_bkt_status === 'New')
                    ?.cnt || 0}</div>
                    <div class="lbl">New Leads</div>
                  </div>
                  <div class="st green_text">
                    <div class="val"> {count_info_data?.find((i) => i?.ld_bkt_status === 'Close')
                    ?.cnt || 0}</div>
                    <div class="lbl">Close Leads</div>
                  </div>
                </div>
              </div>
          </Col>
          <Col xl={4} lg={4} className='mt-3 mt-md-0'>
              <div className='panel_admin'>
                <h3>Lead Activity <span>Today</span></h3>
                <div class="stat-quad">
                  <div class="sq"><div class="val">{employee_list?.todayWarmCount}</div><div class="lbl">Warm Leads</div></div>
                  <div class="sq"><div class="val">{employee_list?.todayHotCount}</div><div class="lbl">Hot Leads</div></div>
                  <div class="sq"><div class="val">{employee_list?.todayCloseCount}</div><div class="lbl">Close Leads</div></div>
                  <div class="sq"><div class="val">{employee_list?.todayConvertCount}</div><div class="lbl">Convert Leads</div></div>
                </div>
              </div>
          </Col>
          <Col xl={4} lg={4} className='mt-3 mt-md-0'>
              <div className='panel_admin'>
                <h3>Bucket <span>Status</span></h3>
                <div class="bucket-grid">
                  <div class="bucket-tile bt-total">
                    <div class="b-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6M4.93 10.93l4.24 4.24M2 19h20M14.83 15.17l4.24-4.24"></path><circle cx="12" cy="19" r="2"></circle></svg></div>
                    <div>
                      <div class="val">
                        {count_info_data?.find(
                            (i) => i?.ld_bkt_status === 'Total Leads'
                          )?.cnt || 0}
                        </div>
                      <div class="lbl">Total Count</div>
                    </div>
                  </div>
                  <div class="bucket-tile bt-cold">
                    <div class="b-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg></div>
                    <div>
                      <div class="val">
                        {' '}
                        {count_info_data?.find(
                          (i) => i?.ld_bkt_status === 'Cold'
                        )?.cnt || 0}
                      </div>
                      <div class="lbl">Cold Status</div>
                    </div>
                  </div>
                  <div class="bucket-tile bt-warm">
                    <div class="b-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"></path></svg></div>
                    <div>
                      <div class="val">
                        {' '}
                          {count_info_data?.find(
                            (i) => i?.ld_bkt_status === 'Warm'
                          )?.cnt || 0}
                      </div>
                      <div class="lbl">Warm Status</div>
                    </div>
                  </div>
                  <div class="bucket-tile bt-conv">
                    <div class="b-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><path d="M8 21h8M12 17v4"></path></svg></div>
                    <div>
                      <div class="val">
                        {count_info_data?.find(
                          (i) => i?.ld_bkt_status === 'Convert'
                        )?.cnt || 0}
                      </div>
                      <div class="lbl">Convert Status</div>
                    </div>
                  </div>
                </div>
              </div>
          </Col>
        </Row>
        

        <div className="card_table mt-3">
          <div className='headsse justify-content-between'>
              <div>
                <h5>Agent Performance</h5>
                <p>Track agent productivity, follow-ups, and conversions with real-time insights.</p>
              </div>
              <div className='breadcrumb_serch'>
                <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
                 <input
                  size="small"
                  type="search"
                  id="search"
                  name="search"
                  placeholder="Search"
                  onChange={handleSearchChange}
                  value={searchText}
                
                />
              </div>
          </div>
         
        

        <CustomTable tablehead={tablehead} tablerow={tablerow} />
        <CustomToPagination
          setPage={setPage}
          page={page}
          data={employee_details?.data?.response}
        />
        </div>
       
      </div>
    </>
  );
};

export default Dashboard;
