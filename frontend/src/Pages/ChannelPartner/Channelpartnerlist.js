import { FilterAlt, RemoveRedEye } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import CustomTable from '../../Shared/CustomTable';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';

const AllChannelpartner = () => {
  const [loading, setloding] = useState(false);
  const [page, setPage] = useState(1); // 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
  const { isLoading, data: ChaneelData } = useQuery(
    ['all_cahnnel_list', page, rowsPerPage, fk],
    () => {
      const reqBody = {
        search: fk.values.search,
        start_date: fk.values.start_date,
        end_date: fk.values.end_date,
      };
      const response = axiosInstance.post(API_URLS.channel_partner, {
        ...reqBody,
        page: page,
        count: rowsPerPage,
      });
      return response;
    }
  );
  const data = ChaneelData?.data?.response || [];

  const tablehead = [
    <span>S.No</span>,
    <span>Username</span>,
    <span>Name</span>,
    <span>Mobile</span>,
    <span>Email</span>,
    <span>Firm Name</span>,
    <span>Emp Unique ID</span>,
  ];

  const tablerow = data?.data?.map((i, index) => {
    return [
      <span>{index + 1}</span>,
      <span>{i?.cp_unique_id}</span>,
      <span>{i?.cp_name}</span>,
      <span>{i?.cp_mobile_no}</span>,
      <span>{i?.cp_email}</span>,
      <span>{i?.cp_firm_name}</span>,
      <span>{i?.emp_details?.emp_unique_id}</span>,
    ];
  });

  return (
    <div>
      <CustomCircularProgress isLoading={isLoading} />
      <div className="grid grid-cols-2 sm:flex gap-3 md:gap-3  px-3 py-2 !bg-[#EBE9FD]">
        <div className="flex">
          <span className="text-xs text-center mr-3">From:</span>
          <TextField
            size="small"
            type="date"
            id="start_date"
            name="start_date"
            value={fk.values.start_date}
            onChange={fk.handleChange}
            InputLabelProps={{ shrink: true }}
            className="!min-w-[110px]  !md:min-w-[200px]"
            InputProps={{
              shrink: true,
              sx: {
                fontSize: {
                  xs: '0.75rem',
                  md: '1rem',
                },
                '& input': {
                  padding: {
                    xs: '6px',
                    md: '8px',
                  },
                  fontSize: {
                    xs: '0.75rem',
                    md: '1rem',
                  },
                },
                '& .MuiSvgIcon-root': {
                  fontSize: {
                    xs: '1rem',
                    md: '1.5rem',
                  },
                },
              },
            }}
          />
        </div>
        <div className="flex ">
          <span className="text-xs text-center mr-3">To:</span>
          <TextField
            size="small"
            type="date"
            id="end_date"
            name="end_date"
            value={fk.values.end_date}
            onChange={fk.handleChange}
            className="!min-w-[110px]  !md:min-w-[200px]"
            InputProps={{
              sx: {
                fontSize: {
                  xs: '0.78rem',
                  md: '1rem',
                },
                '& input': {
                  padding: {
                    xs: '6px',
                    md: '8px',
                  },
                  fontSize: {
                    xs: '0.78rem',
                    md: '1rem',
                  },
                },
                '& .MuiSvgIcon-root': {
                  fontSize: {
                    xs: '1rem',
                    md: '1.5rem',
                  },
                },
              },
            }}
          />
        </div>
        <div className="flex ">
          <TextField
            size="small"
            type="search"
            id="search"
            name="search"
            placeholder="Search"
            value={fk.values.search}
            onChange={(e) => {
              fk.handleChange(e);
            }}
          />
        </div>
        <div className="flex !ml-7 md:!ml-0">
          <Button
            onClick={fk.handleSubmit}
            variant="contained"
            startIcon={<FilterAlt className="w-4 h-4" />}
            sx={{
              '& .MuiButton-startIcon': {
                marginRight: '3px',
              },
            }}
          >
            Filter
          </Button>
        </div>
      </div>
      <CustomTable
        tablehead={tablehead}
        tablerow={tablerow}
        isLoading={loading}
      />
      <CustomToPagination setPage={setPage} page={page} data={data} />
    </div>
  );
};

export default AllChannelpartner;
