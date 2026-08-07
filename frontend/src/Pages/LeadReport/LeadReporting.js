import { FilterAlt } from '@mui/icons-material';
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
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import CustomTable from '../../Shared/CustomTable';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';

const LeadReporting = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setloding] = useState(false);
  const [data, setData] = useState([]);
  const [selectedId, setId] = useState(null);
  const initialValue = {
    username: '',
    start_date: '',
    end_date: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
    onSubmit: () => {
      setloding(true);
      const reqBody = {
        username: fk.values.username,
        start_date: fk.values.start_date,
        end_date: fk.values.end_date,
      };
      CustomerFn(reqBody);
    },
  });

  const CustomerFn = async (reqBody) => {
    setloding(true);
    try {
      const response = await axiosInstance.post(API_URLS.customer, reqBody);
      setData(response?.data?.data || []);
      setloding(false);
    } catch (e) {
      console.log(e);
    }
  };

  const Customerstatusfn = async (id) => {
    const reqBody = {
      u_user_id: id,
    };
    try {
      const res = await axiosInstance.post(API_URLS.customer_status, reqBody);
      toast(res?.data?.msg);
      if (res?.data?.msg === 'IP Status Updated Successfully.') {
        CustomerFn();
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    CustomerFn();
  }, []);

  const initialValuess = {
    co_user_id: '',
    req_coins: '',
  };

  const formik = useFormik({
    initialValues: initialValuess,
    enableReinitialize: true,
    onSubmit: () => {
      const reqBody = {
        co_user_id: selectedId,
        req_coins: formik.values.req_coins,
      };
      CoinAddFn(reqBody);
    },
  });

  async function CoinAddFn(reqBody) {
    try {
      const res = await axiosInstance.post(API_URLS.coin_add, reqBody);
      toast.success(res?.data?.msg);
      if (res?.data?.msg === 'Transacton successfully completed.') {
        fk.handleReset();
        setOpenDialog(false);
      }
    } catch (e) {
      console.log(e);
    }
  }

  const tablehead = [
    <span>S.No</span>,
    <span>First Name</span>,
    <span>Last Name</span>,
    <span>Mobile</span>,
    <span>Email</span>,
    <span>Total Coin</span>,
    <span>Used Coin</span>,
    <span>Customer ID</span>,
    <span>Coin</span>,
    <span>Status</span>,
  ];

  const tablerow = data?.map((i, index) => {
    return [
      <span>{index + 1}</span>,

      <span>{i?.c_first_name}</span>,
      <span>{i?.c_last_name}</span>,
      <span>{i?.c_mobile}</span>,
      <span>{i?.c_email}</span>,
      <span>{Number(i?.c_total_coins)?.toFixed(2)}</span>,
      <span>{Number(i?.c_used_coins)?.toFixed(2)}</span>,
      <span>{i?.lo_cust_id}</span>,
      <span
        onClick={() => {
          setId(i?.c_lo_id);
          setOpenDialog(true);
        }}
        className="text-green-600 text-xl"
      >
        +{' '}
      </span>,
      <span>
        <Switch
          onClick={() => Customerstatusfn(i?.c_lo_id)}
          checked={i?.c_status === 'Deactive' ? false : true}
        />
      </span>,
    ];
  });

  return (
    <div>
      <CustomCircularProgress isLoading={loading} />
      <div className="flex px-2 gap-2 !justify-start py-2">
        <span className="!text-xs !text-center">From:</span>
        <TextField
          size="small"
          type="date"
          id="start_date"
          name="start_date"
          value={fk.values.start_date}
          onChange={fk.handleChange}
        />
        <span className="!text-xs !text-center">To:</span>
        <TextField
          size="small"
          type="date"
          id="end_date"
          name="end_date"
          value={fk.values.end_date}
          onChange={fk.handleChange}
        />
        <TextField
          size="small"
          type="search"
          id="username"
          name="username"
          placeholder="Search"
          value={fk.values.username}
          onChange={fk.handleChange}
        />
        <Button
          onClick={fk.handleSubmit}
          variant="contained"
          startIcon={<FilterAlt />}
        >
          Filter
        </Button>
      </div>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle> Coin</DialogTitle>
        <DialogContent>
          <div className="flex justify-center gap-3">
            <p className="text-center mt-2">Credit Coin : </p>
            <TextField
              size="small"
              id="req_coins"
              name="req_coins"
              type="number"
              value={formik.values.req_coins}
              onChange={formik.handleChange}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={formik.handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
      <CustomTable
        tablehead={tablehead}
        tablerow={tablerow}
        isLoading={loading}
      />
    </div>
  );
};

export default LeadReporting;
