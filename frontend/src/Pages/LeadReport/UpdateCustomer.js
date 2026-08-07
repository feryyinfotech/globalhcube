import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';

const UpdateCustomer = () => {
  const location = useLocation();
  const id = location?.state?.c_lo_id;
  const [loding, setloding] = useState(false);
  const navigate = useNavigate();

  const initialValue = {
    l_name: location?.state?.c_last_name || '',
    f_name: location?.state?.c_first_name || '',
    coin_rate: location?.state?.c_coin_rate || '',
    user_status: location?.state?.c_status === 'Deactive' ? '2' : '1',
    address: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
    onSubmit: () => {
      const reqBody = {
        user_id: id,
        address: fk.values.address,
        user_status: fk.values.user_status,
        l_name: fk.values.l_name,
        f_name: fk.values.f_name,
        coin_rate: fk.values.coin_rate,
      };
      CustomerUpdate(reqBody);
    },
  });
  async function CustomerUpdate(reqBody) {
    setloding(true);
    try {
      const res = await axiosInstance.post(API_URLS.update_customer, reqBody);
      toast.success(res?.data?.msg);
      if (res?.data?.msg === 'Customer Updated Successfully.') {
        navigate('/customer');
      }
    } catch (e) {
      console.log(e);
    }
    setloding(false);
  }

  if (loding)
    return (
      <div className="w-[100%] h-[100%] flex justify-center items-center">
        <CircularProgress />
      </div>
    );
  return (
    <>
      <CustomCircularProgress isLoading={loding} />
      <div className="!flex justify-center items-center w-full">
        <div className="p-5  w-full rounded-lg">
          <p className="!text-center font-bold !py-4 !pb-10 text-lg">
            Update Customer Record
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 md:gid-cols-2 gap-[6%] gap-y-4">
            <div className="">
              <p className="font-bold">First Name</p>
              <TextField
                fullWidth
                id="f_name"
                name="f_name"
                placeholder="name"
                value={fk.values.f_name}
                onChange={fk.handleChange}
              />
            </div>
            <div className="">
              <p className="font-bold">Last Name</p>
              <TextField
                fullWidth
                id="l_name"
                name="l_name"
                placeholder="name"
                value={fk.values.l_name}
                onChange={fk.handleChange}
              />
            </div>
            <div>
              {' '}
              <p className="font-bold">Mobile Number</p>
              <TextField fullWidth value={location?.state?.c_mobile} />
            </div>
            <div>
              <p className="font-bold">Email</p>
              <TextField fullWidth value={location?.state?.c_email} />
            </div>
            <div>
              <p className="font-bold">Coin Rate</p>
              <TextField
                fullWidth
                type="number"
                id="coin_rate"
                name="coin_rate"
                placeholder=" Rate"
                value={fk.values.coin_rate}
                onChange={fk.handleChange}
              />
            </div>
            <div>
              <p className="font-bold">Addresss</p>
              <TextField
                fullWidth
                id="address"
                name="address"
                placeholder="address"
                value={fk.values.address}
                onChange={fk.handleChange}
              />
            </div>

            <div>
              <p className="font-bold ">Status</p>

              <FormControl>
                <RadioGroup
                  aria-labelledby="demo-controlled-radio-buttons-group"
                  name="controlled-radio-buttons-group"
                  value={fk.values.user_status}
                  onChange={(e) =>
                    fk.setFieldValue('user_status', e.target.value)
                  }
                >
                  <Box display="flex" flexDirection="row" gap={2}>
                    <FormControlLabel
                      value="1"
                      control={<Radio />}
                      label="Active"
                    />
                    <FormControlLabel
                      value="2"
                      control={<Radio />}
                      label="Deactive"
                    />
                  </Box>
                </RadioGroup>
              </FormControl>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button
              onClick={() => fk.handleReset()}
              variant="contained"
              className="!bg-[#E74C3C]"
            >
              Clear
            </Button>
            <Button
              onClick={() => fk.handleSubmit()}
              variant="contained"
              className="!bg-[#07BC0C]"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateCustomer;
