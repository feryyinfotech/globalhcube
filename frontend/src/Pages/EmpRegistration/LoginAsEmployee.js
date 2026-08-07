import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation, useQuery } from 'react-query';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';

const ACCENT = '#4F46E5';
const INK = '#1E1B4B';
const MUTED = '#6B7280';
const BORDER = '#E7E7F3';

const AVATAR_COLORS = [
  '#4F46E5',
  '#0891B2',
  '#D97706',
  '#DC2626',
  '#15803D',
  '#7C3AED',
  '#DB2777',
  '#2563EB',
];
const colorForName = (name = '') =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const LoginAsEmployee = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
        setPage(1);
      }, 400),
    []
  );
  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

  const { isLoading, data } = useQuery(
    ['emp_list_login_as', page, search],
    () =>
      axiosInstance.post(API_URLS.emp_registration_list, {
        search,
        page,
        count: rowsPerPage,
      })
  );
  const response = data?.data?.response || {};
  const employees = response?.data || [];

  const { mutate: loginAs, isLoading: isSwitching } = useMutation(
    (emp_id) =>
      axiosInstance.post(API_URLS.admin_login_as_employee, { emp_id }),
    {
      onSuccess: (res) => {
        if (res?.data?.success) {
          const token = res?.data?.response?.[0]?.token;
          const empName = res?.data?.response?.[0]?.emp_name;
          // Stash the admin's own token + name before overwriting them, so
          // the "Return to Admin" banner can restore them later without a
          // fresh login.
          sessionStorage.setItem(
            'admin_token_backup',
            localStorage.getItem('token') || ''
          );
          sessionStorage.setItem(
            'admin_name_backup',
            localStorage.getItem('name') || ''
          );
          localStorage.setItem('token', token);
          localStorage.setItem('user_role', 'employee');
          localStorage.setItem('name', empName || '');
          window.location.href = '/employee-dashboard';
        } else {
          toast(res?.data?.msg || 'Failed to login as employee');
        }
      },
      onError: () => {
        toast.error('Failed to login as employee');
      },
    }
  );

  const handleLoginAs = (emp) => {
    Swal.fire({
      icon: 'question',
      title: 'Login as this employee?',
      html: `You'll be switched into <b>${emp?.emp_name || 'this employee'
        }</b>'s account. You can log back in as admin afterwards.`,
      showCancelButton: true,
      confirmButtonText: 'Yes, login as them',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) loginAs(emp.emp_id);
    });
  };

  return (
    <div className="p-3 md:p-6">
      <CustomCircularProgress isLoading={isLoading || isSwitching} />
      <div class="breadcruumb_section">
        <div class="breadcrumb_content">
          <h3>Users</h3>
          <p>Select an employee to view the app as them</p>
          </div>
          <div class="breadcrumb_serch">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
             <input
          size="small"
          placeholder="Search by name, mobile, ID..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            debouncedSetSearch(e.target.value);
          }}
          className="w-full sm:w-72"
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


      <div className="grid xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-2">
        {employees.length > 0 ? (
          employees.map((emp) => {
            const isActive = emp?.emp_lgn_status !== 'Deactive';
            return (
              <div
                key={emp.emp_id}
                className="emp-card">
                <div className="flex items-center gap-3">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: colorForName(emp?.emp_name) }}
                  >
                    {emp?.emp_name ? emp.emp_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <h4 className='mb-0'
                      title={emp?.emp_name}
                    >
                      {emp?.emp_name || '--'}
                    </h4>
                    <p className="mb-0" style={{ color: MUTED }}>
                      {emp?.emp_unique_id}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between text-xs my-2"
                  style={{ color: MUTED }}
                >
                  <span>{emp?.emp_mobile || '--'}</span>
                  <span
                    className={`status-tag ${isActive
                        ? 'status_green'
                        : 'status_red'
                      }`}
                  >
                    {isActive ? 'Active' : 'Deactive'}
                  </span>
                </div>

                <button
                  onClick={() => handleLoginAs(emp)}
                  disabled={!isActive}
                  className="login_crd_btn disabled:cursor-not-allowed"
                  style={{ backgroundColor: isActive ? ACCENT : '#C7CBF7' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path></svg>
                  Login as Employee
                </button>
              </div>
            );
          })
        ) : (
          <div
            className="col-span-full text-center py-10"
            style={{ color: MUTED }}
          >
            No employees found.
          </div>
        )}
      </div>

      <div className="mt-4">
        <CustomToPagination setPage={setPage} page={page} data={response} />
      </div>
    </div>
  );
};

export default LoginAsEmployee;
