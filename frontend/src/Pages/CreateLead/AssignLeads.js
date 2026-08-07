import { Button, MenuItem, TextField } from '@mui/material';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import { toLocalMoment } from '../../utils/dateUtils';

const AssignLeads = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEmpByLead, setSelectedEmpByLead] = useState({});
  const client = useQueryClient();

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value) => {
        setSearch(value);
        setPage(1);
      }, 500),
    []
  );
  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);

  const { isLoading, data: leadData } = useQuery(
    ['unassigned_lead_data', page, rowsPerPage, search],
    () =>
      axiosInstance.post(API_URLS.unassigned_lead_list, {
        search,
        page,
        count: rowsPerPage,
      })
  );
  const data = leadData?.data?.response || [];
  const leads = data?.data || [];

  const { data: employee } = useQuery(
    ['employee_list_for_assign'],
    () => axiosInstance.get(API_URLS?.employee_list_dropdown),
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );
  const employee_list = useMemo(() => {
    const list = employee?.data?.response || [];
    return [...list].sort((a, b) =>
      (a?.emp_name || '').localeCompare(b?.emp_name || '', undefined, {
        sensitivity: 'base',
      })
    );
  }, [employee]);

  const { mutate: assignLead, isLoading: isAssigning } = useMutation(
    ({ lead_id, emp_id }) =>
      axiosInstance.post(API_URLS.assign_lead_to_employee, { lead_id, emp_id }),
    {
      onSuccess: (res) => {
        if (res?.data?.success) {
          Swal.fire({
            icon: 'success',
            title: 'Assigned!',
            text: res?.data?.msg || 'Lead has been assigned successfully.',
            timer: 1800,
            showConfirmButton: false,
          });
          client.refetchQueries('unassigned_lead_data');
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Oops!',
            text: res?.data?.msg || 'Something went wrong.',
          });
        }
      },
      onError: () => {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Failed to assign lead. Please try again.',
        });
      },
    }
  );

  const handleAssignClick = (lead) => {
    const emp_id = selectedEmpByLead[lead?.lead_id];
    const emp = employee_list?.find((e) => e?.emp_id === emp_id);

    Swal.fire({
      icon: 'question',
      title: 'Assign this lead?',
      html: `Assign <b>${lead?.lead_cust_name || 'this lead'}</b> to <b>${emp?.emp_name || 'selected employee'
        }</b>?`,
      showCancelButton: true,
      confirmButtonText: 'Yes, assign',
      cancelButtonText: 'Cancel',
      customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        assignLead({ lead_id: lead.lead_id, emp_id });
      }
    });
  };

  return (
    <div className="p-3">
      <CustomCircularProgress isLoading={isLoading || isAssigning} />
      <div className='card_table'>
        <div class="headsse justify-content-between">
          <div>
            <h5>Fresh Leads (Unassigned)</h5>
            <p>Leads you created, or that were assigned to you</p>
          </div>
          <div className='breadcrumb_serch'>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
            <input
              size="small"
              placeholder="Search by Lead ID, Name, Mobile..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSetSearch(e.target.value);
              }}
        />
          </div>
        </div>
          

      {/* Table */}
      <div className="overflow-x-auto main_table mt-3">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Lead ID</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Source</th>
              <th>Enquired</th>
              <th>Assign To</th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((i, idx) => (
                <tr
                  key={i?.lead_id}>
                  <td className="px-4 py-3">
                    {(page - 1) * rowsPerPage + idx + 1}
                  </td>
                  <td>
                    {i?.lead_unique_id}
                  </td>
                  <td>
                    {i?.lead_cust_name || 'N/A'}
                  </td>
                  <td>
                    {i?.lead_mob_no || 'N/A'}
                  </td>
                  <td>
                    {i?.ld_src_name || 'N/A'}
                  </td>
                  <td >
                    {i?.lead_created_at
                      ? toLocalMoment(i.lead_created_at).format('D MMM YY, hh:mm A')
                      : 'N/A'}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <TextField
                        select
                        size="small"
                        className="min-w-[160px] bg-[#EBE9FD] rounded-md"
                        value={selectedEmpByLead[i?.lead_id] || ''}
                        onChange={(e) =>
                          setSelectedEmpByLead((prev) => ({
                            ...prev,
                            [i.lead_id]: e.target.value,
                          }))
                        }
                      >
                        <MenuItem value="">Select Employee</MenuItem>
                        {employee_list?.map((item) => (
                          <MenuItem key={item?.emp_id} value={item?.emp_id}>
                            {item?.emp_name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!selectedEmpByLead[i?.lead_id]}
                        onClick={() => handleAssignClick(i)}
                        sx={{
                          backgroundColor: '#000',
                          '&:hover': { backgroundColor: '#333' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Assign
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No unassigned leads found.
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
    </div>
  );
};

export default AssignLeads;