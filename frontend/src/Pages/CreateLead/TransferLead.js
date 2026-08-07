import { Button, MenuItem, TextField } from '@mui/material';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import CustomTable from '../../Shared/CustomTable';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';

const TransferLead = () => {
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
    ['lead_list_for_transfer', page, rowsPerPage, search],
    () =>
      axiosInstance.post(API_URLS.lead_list_for_transfer, {
        search,
        page,
        count: rowsPerPage,
      })
  );
  const data = leadData?.data?.response || [];
  const leads = data?.data || [];

  const { data: employee } = useQuery(
    ['employee_list_for_transfer'],
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

  const { mutate: transferLead, isLoading: isTransferring } = useMutation(
    ({ lead_id, emp_id }) =>
      axiosInstance.post(API_URLS.transfer_lead_to_employee, {
        lead_id,
        emp_id,
      }),
    {
      onSuccess: (res) => {
        toast(res?.data?.msg);
        if (res?.data?.success) {
          client.refetchQueries('lead_list_for_transfer');
        }
      },
      onError: () => {
        toast.error('Failed to transfer lead');
      },
    }
  );

  const tablehead = [
    <span>S.No</span>,
    <span>Lead ID</span>,
    <span>Name</span>,
    <span>Mobile</span>,
    <span>Current Employee</span>,
    <span>Transfer To</span>,
  ];

  const tablerow = leads.map((i, index) => [
    <span>{(page - 1) * rowsPerPage + index + 1}</span>,
    <span>{i?.lead_unique_id}</span>,
    <span>{i?.lead_cust_name}</span>,
    <span>{i?.lead_mob_no}</span>,
    <span>{i?.emp_name ? `${i.emp_name} (${i.emp_mobile || '--'})` : '-- Unassigned --'}</span>,
    <span className="flex gap-2 items-center justify-center">
      <TextField
        select
        size="small"
        className="min-w-[160px]"
        value={selectedEmpByLead[i?.lead_id] || ''}
        onChange={(e) =>
          setSelectedEmpByLead((prev) => ({
            ...prev,
            [i.lead_id]: e.target.value,
          }))
        }
      >
        <MenuItem value="">Select Employee</MenuItem>
        {employee_list
          ?.filter((item) => item.emp_id !== i.emp_id)
          ?.map((item) => (
            <MenuItem key={item?.emp_id} value={item?.emp_id}>
              {item?.emp_name}
            </MenuItem>
          ))}
      </TextField>
      <Button
        variant="contained"
        size="small"
        disabled={!selectedEmpByLead[i?.lead_id]}
        onClick={() =>
          transferLead({
            lead_id: i.lead_id,
            emp_id: selectedEmpByLead[i.lead_id],
          })
        }
        sx={{
          backgroundColor: '#000',
          '&:hover': { backgroundColor: '#333' },
        }}
      >
        Transfer
      </Button>
    </span>,
  ]);

  return (
    <div className="p-3">
      <CustomCircularProgress isLoading={isLoading || isTransferring} />
      <div className='card_table'>
        <div className="headsse justify-content-between">
          <div>
            <h5>Transfer Lead</h5>
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

        <CustomTable tablehead={tablehead} tablerow={tablerow} isLoading={isLoading} />
        <CustomToPagination setPage={setPage} page={page} data={data} />
      </div>
    </div>
  );
};

export default TransferLead;
