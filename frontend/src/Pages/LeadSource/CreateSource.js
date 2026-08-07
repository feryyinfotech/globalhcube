import { Button, TextField } from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/CustomDialogBox';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';

const CreateSource = ({ onClose, onSuccess }) => {
  const [loading, setloading] = useState(false);

  const initialValue = {
    ld_src_name: '',
    ld_src_des: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
    onSubmit: (values) => {
      mutate(values);
    },
  });

  const { mutate } = useMutation(
    async (values) => {
      setloading(true);
      const reqBody = {
        ld_src_name: values.ld_src_name,
        ld_src_des: values.ld_src_des,
      };
      return axiosInstance.post(API_URLS.lead_source_add, reqBody);
    },
    {
      onSuccess: (response) => {
        const msg = response?.data?.msg;
        toast(msg);
        if (msg === 'Data Saved Successfully') {
          fk.resetForm();
          onSuccess?.();   // refetch list in parent
          onClose?.();     // close modal
        }
        setloading(false);
      },
      onError: (error) => {
        toast('Error saving data');
        console.error(error);
        setloading(false);
      },
    }
  );

  return (
    <>
      <CustomCircularProgress isLoading={loading} />
      <div className="w-full p-2">
        <p className="!text-center font-bold text-lg">Lead Source</p>
        <div className="grid grid-cols-1 gap-y-6 p-5">
          <div>
            <p className="font-bold">Lead Source Name</p>
            <TextField
              fullWidth
              id="ld_src_name"
              name="ld_src_name"
              placeholder="Name"
              value={fk.values.ld_src_name}
              onChange={fk.handleChange}
              className="bg-[#EBE9FD]"
            />
          </div>
          <div>
            <p className="font-bold">Lead Source Description</p>
            <TextField
              fullWidth
              id="ld_src_des"
              name="ld_src_des"
              placeholder="Enter Description"
              value={fk.values.ld_src_des}
              onChange={fk.handleChange}
              className="bg-[#EBE9FD]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <Button
            onClick={() => {
              fk.handleReset();
              onClose?.();
            }}
            variant="contained"
            className="!bg-gradient-to-b from-[#7981F9] to-[#5E60D0]"
          >
            Cancel
          </Button>
          <Button
            onClick={() => fk.handleSubmit()}
            variant="contained"
            className="!bg-gradient-to-b from-[#E64F4F] to-[#FFAFAF]"
          >
            Submit
          </Button>
        </div>
      </div>
    </>
  );
};

export default CreateSource;