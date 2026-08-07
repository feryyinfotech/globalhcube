import {
  Edit,
  FilterAlt,
  RemoveRedEye,
  Search as SearchIcon,
  ViewColumn,
} from '@mui/icons-material';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';

const ACCENT = '#4F46E5';
const ACCENT_SOFT = '#EEF0FF';
const INK = '#1E1B4B';
const MUTED = '#6B7280';
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

// Columns that are always shown and can't be hidden
const ESSENTIAL_COLUMNS = [
  { key: 'sno', label: 'S.No' },
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'mobile', label: 'Mobile' },
];

// Columns the user can toggle on/off from the "Columns" menu
const TOGGLEABLE_COLUMNS = [
  { key: 'password', label: 'Password' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'sponsor_name', label: 'Sponsor Name' },
  { key: 'team_name', label: 'Team Name' },
  { key: 'city_name', label: 'City Name' },
  { key: 'state_name', label: 'State Name' },
  { key: 'work_preference', label: 'Work Preference' },
];

const AllRegistration = () => {
  const [loading, setloding] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [colMenuAnchor, setColMenuAnchor] = useState(null);
  const [visibleCols, setVisibleCols] = useState(() =>
    Object.fromEntries(TOGGLEABLE_COLUMNS.map((c) => [c.key, true]))
  );
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

  const { isLoading, data: RegistrationData } = useQuery(
    ['all_registration_list', page, rowsPerPage, fk],
    () => {
      const reqBody = {
        search: fk.values.search,
        start_date: fk.values.start_date,
        end_date: fk.values.end_date,
      };
      return axiosInstance.post(API_URLS.emp_registration_list, {
        ...reqBody,
        page,
        count: rowsPerPage,
      });
    }
  );
  const data = RegistrationData?.data?.response || [];
  const rows = data?.data || [];

  const { data: empDialogData, isEmpLoading } = useQuery(
    ['employee_details_dialog', selectedEmpId],
    () =>
      axiosInstance.get(`${API_URLS.employee_profile}?emp_id=${selectedEmpId}`),
    { enabled: !!selectedEmpId && openDialog }
  );
  const employeeDialogInfo = empDialogData?.data?.response?.[0];

  const EmployeestatusFn = async (id) => {
    try {
      setloding(true);
      const res = await axiosInstance.get(
        `${API_URLS.emp_registration_status}?emp_id=${id}`
      );
      toast(res.data.msg);
      client.refetchQueries('all_registration_list');
    } catch (err) {
      toast('Failed to update status');
    } finally {
      setloding(false);
    }
  };

  const editFk = useFormik({
    enableReinitialize: true,
    initialValues: {
      emp_id: editingEmp?.emp_id || '',
      name: editingEmp?.emp_name || '',
      mobile: editingEmp?.emp_mobile || '',
      email: editingEmp?.emp_email || '',
      address: editingEmp?.emp_address || '',
      sponsor_name: editingEmp?.emp_sponsor_name || '',
      team_name: editingEmp?.emp_team_name || '',
      city_name: editingEmp?.emp_city_name || '',
      state_name: editingEmp?.emp_state_name || '',
      work_preference: editingEmp?.emp_work_preference || '',
      password: '',
    },
    onSubmit: () => {
      updateEmployee();
    },
  });

  const { mutate: updateEmployee, isLoading: isUpdating } = useMutation(
    () => axiosInstance.post(API_URLS.emp_registration_update, editFk.values),
    {
      onSuccess: (res) => {
        toast(res?.data?.msg);
        if (res?.data?.success) {
          setOpenEditDialog(false);
          setEditingEmp(null);
          client.refetchQueries('all_registration_list');
        }
      },
      onError: () => {
        toast.error('Failed to update employee');
      },
    }
  );

  const toggleCol = (key) => {
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleToggleCols = useMemo(
    () => TOGGLEABLE_COLUMNS.filter((c) => visibleCols[c.key]),
    [visibleCols]
  );

  const totalColSpan = ESSENTIAL_COLUMNS.length + visibleToggleCols.length + 2; // + Status + Details

  return (
    <div className="p-3 md:p-6">
      <CustomCircularProgress
        isLoading={loading || isEmpLoading || isLoading || isUpdating}
      />

      {/* Page header */}
      <div className="breadcruumb_section">
        <div class="breadcrumb_content">
          <h3>Employee List</h3>
          <p>{data?.total_count ?? rows.length} employee{rows.length === 1 ? '' : 's'}</p>
        </div>
        <div className='breadcrumb_serch'>
          <Button className="btn btn-primary"
            onClick={(e) => setColMenuAnchor(e.currentTarget)}
            variant="outlined"
            startIcon={<ViewColumn sx={{ fontSize: 18 }} />}>
            Columns
          </Button>
        </div>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Menu
          anchorEl={colMenuAnchor}
          open={Boolean(colMenuAnchor)}
          onClose={() => setColMenuAnchor(null)}
          PaperProps={{ sx: { borderRadius: '12px', minWidth: 220 } }}
        >
          <p className="px-4 pt-2 pb-1 text-xs font-semibold" style={{ color: MUTED }}>
            SHOW / HIDE COLUMNS
          </p>
          {TOGGLEABLE_COLUMNS.map((col) => (
            <MenuItem
              key={col.key}
              onClick={() => toggleCol(col.key)}
              dense
              sx={{ py: 0.25 }}
            >
              <Checkbox
                checked={!!visibleCols[col.key]}
                size="small"
                sx={{
                  color: BORDER,
                  '&.Mui-checked': { color: ACCENT },
                }}
              />
              <ListItemText primary={col.label} />
            </MenuItem>
          ))}
        </Menu>
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
              <tr style={{ backgroundColor: ACCENT_SOFT }}>
                <th>S.No</th>
                <th>Username</th>
                <th>Name</th>
                <th>Mobile</th>
                {visibleToggleCols.map((col) => (
                  <th key={col.key}>
                    {col.label}
                  </th>
                ))}
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((i, index) => {
                  const isActive = i?.emp_lgn_status !== 'Deactive';
                  const cellFor = {
                    password: i?.emp_pass || '--',
                    email: i?.emp_email || '--',
                    address: i?.emp_address || '--',
                    sponsor_name: i?.emp_sponsor_name || '--',
                    team_name: i?.emp_team_name || '--',
                    city_name: i?.emp_city_name || '--',
                    state_name: i?.emp_state_name || '--',
                    work_preference: i?.emp_work_preference || '--',
                  };
                  return (
                    <tr
                      key={i?.emp_id ?? index}
                      >
                      <td style={{ color: MUTED }}>
                        {(page - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="" style={{ color: '#374151' }}>
                        {i?.emp_unique_id || '--'}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: INK }}>
                        {i?.emp_name || '--'}
                      </td>
                      <td className="" style={{ color: '#374151' }}>
                        {i?.emp_mobile || '--'}
                      </td>
                      {visibleToggleCols.map((col) => (
                        <td
                          key={col.key}
                          className=""
                          style={{ color: '#374151' }}
                        >
                          {cellFor[col.key]}
                        </td>
                      ))}
                      <td >
                        <div className="flex items-center gap-2">
                          <Switch
                            size="small"
                            checked={isActive}
                            onClick={() => EmployeestatusFn(i?.emp_id)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: ACCENT,
                              },
                            }}
                          />
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              color: isActive ? '#15803D' : '#9CA3AF',
                              backgroundColor: isActive ? '#DCFCE7' : '#F3F4F6',
                            }}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td >
                        <div className="flex items-center gap-2">
                          <RemoveRedEye
                            className="cursor-pointer"
                            sx={{ fontSize: 20, color: MUTED }}
                            onClick={() => {
                              setSelectedEmpId(i?.emp_id);
                              setOpenDialog(true);
                            }}
                          />
                          <Edit
                            className="cursor-pointer"
                            sx={{ fontSize: 20, color: ACCENT }}
                            onClick={() => {
                              setEditingEmp(i);
                              setOpenEditDialog(true);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={totalColSpan} className="text-center py-12" style={{ color: MUTED }}>
                    No employees found. Try adjusting your filters.
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

     

      {/* Bucket status dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-describedby="alert-dialog-slide-description"
        PaperProps={{ className: '!max-w-[600px]', sx: { borderRadius: '14px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: INK }}>
          Employee Bucket Status
        </DialogTitle>
        <DialogContent>
          <table className="w-full text-sm border-collapse rounded-lg overflow-hidden">
            <thead>
              <tr style={{ backgroundColor: ACCENT_SOFT }}>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: INK }}>
                  Title
                </th>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: INK }}>
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {employeeDialogInfo?.bucket_count &&
                Object.entries({
                  New: employeeDialogInfo.bucket_count.new_cnt,
                  Cold: employeeDialogInfo.bucket_count.cold_cnt,
                  Warm: employeeDialogInfo.bucket_count.warm_cnt,
                  Hot: employeeDialogInfo.bucket_count.hot_cnt,
                  Close: employeeDialogInfo.bucket_count.close_cnt,
                  Convert: employeeDialogInfo.bucket_count.convert_cnt,
                  'OutDated Event': employeeDialogInfo.bucket_count.out_dated_evnt_cnt,
                  Ignore: employeeDialogInfo.bucket_count.ignored_cnt,
                }).map(([title, count], idx) => (
                  <tr key={idx} className="border-t" style={{ borderColor: BORDER }}>
                    <td className="px-3 py-2" style={{ color: '#374151' }}>
                      {title}
                    </td>
                    <td className="px-3 py-2 font-medium" style={{ color: INK }}>
                      {count ?? 0}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit employee dialog */}
      <Dialog
        open={openEditDialog}
        aria-describedby="edit-employee-dialog"
        PaperProps={{ className: '!max-w-[700px]', sx: { borderRadius: '14px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: INK }}>Edit Employee</DialogTitle>
        <DialogContent>
          <div className="grid xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 pt-2">
            <TextField
              fullWidth
              size="small"
              label="Name"
              name="name"
              value={editFk.values.name}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="Mobile Number"
              name="mobile"
              value={editFk.values.mobile}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="Email ID"
              name="email"
              value={editFk.values.email}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="Sponsor Name"
              name="sponsor_name"
              value={editFk.values.sponsor_name}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="Team Name"
              name="team_name"
              value={editFk.values.team_name}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="City Name"
              name="city_name"
              value={editFk.values.city_name}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="State Name"
              name="state_name"
              value={editFk.values.state_name}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              size="small"
              select
              label="Work Preference"
              name="work_preference"
              value={editFk.values.work_preference}
              onChange={editFk.handleChange}
              sx={fieldSx}
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="MLM">MLM</MenuItem>
              <MenuItem value="REAL ESTATE">REAL ESTATE</MenuItem>
            </TextField>
            <TextField
              fullWidth
              size="small"
              label="Address"
              name="address"
              value={editFk.values.address}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              size="small"
              type="text"
              label="New Password (leave blank to keep unchanged)"
              name="password"
              value={editFk.values.password}
              onChange={editFk.handleChange}
              sx={fieldSx}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenEditDialog(false);
              setEditingEmp(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={editFk.handleSubmit}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: ACCENT,
              '&:hover': { backgroundColor: '#4038C7' },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AllRegistration;