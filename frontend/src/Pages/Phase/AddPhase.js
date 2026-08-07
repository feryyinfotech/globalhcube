import { Button, TextField } from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/CustomDialogBox';
import { useMutation } from 'react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const Addphase = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state;
  console.log(data?.phase_title);

  const initialValues = {
    phase_id: data?.phase_id || '',
    phase_project_id: data?.pro_id,
    phase_title: data?.phase_title || '',
    phase_direction: data?.phase_direction || '',
    phase_website: data?.phase_website || '',
    phase_description: data?.phase_description || '',
    phase_floor_plans: data?.phase_floor_plans || null,
    phase_brouchure: data?.phase_brouchure || null,
    phase_details: data?.phase_details || null,
  };

  const fk = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: (values) => {
      const formData = new FormData();
      formData.append('phase_id', data?.phase_id);
      formData.append(
        'phase_project_id',
        data?.phase_project_id || data?.pro_id
      );
      formData.append('phase_direction', values.phase_direction);
      formData.append('phase_website', values.phase_website);
      formData.append('phase_description', values.phase_description);
      formData.append('phase_title', values.phase_title);

      if (values.phase_floor_plans) {
        formData.append('phase_floor_plans', values.phase_floor_plans);
      }
      if (values.phase_brouchure) {
        formData.append('phase_brouchure', values.phase_brouchure);
      }
      if (values.phase_details) {
        formData.append('phase_details', values.phase_details);
      }

      mutate(formData);
    },
  });

  const { mutate } = useMutation(
    async (formData) => {
      setLoading(true);
      return data?.phase_project_id
        ? axiosInstance.post(API_URLS.update_phase_details, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : axiosInstance.post(API_URLS.add_phase_details, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
    },
    {
      onSuccess: (response) => {
        const msg = response?.data?.msg;
        toast(msg);
        if (response?.data?.success) {
          navigate('/all_project_list');
          fk.resetForm();
        }
        setLoading(false);
      },
      onError: (error) => {
        toast('Error saving data');
        console.error(error);
        setLoading(false);
      },
    }
  );

  return (
    <>
      <CustomCircularProgress isLoading={loading} />
      <div className="w-[100%] flex justify-center items-center">
        <div className="lg:w-full p-4">
          <p className="!text-center font-bold !py-4 text-lg">
            {data?.phase_project_id ? 'Update' : 'Add'} Phase
          </p>
          <div className="grid lg:grid-cols-2 grid-cols-1 gap-[6%] gap-y-8 p-5 w-full">
            <div>
              <p className="font-bold">Phase Direction</p>
              <TextField
                fullWidth
                id="phase_direction"
                name="phase_direction"
                placeholder="Phase Direction"
                value={fk.values.phase_direction}
                onChange={fk.handleChange}
              />
            </div>
            <div>
              <p className="font-bold">Phase Title</p>
              <TextField
                fullWidth
                id="phase_title"
                name="phase_title"
                placeholder="Phase Title"
                value={fk.values.phase_title}
                onChange={fk.handleChange}
              />
            </div>
            <div>
              <p className="font-bold">Website</p>
              <TextField
                fullWidth
                id="phase_website"
                name="phase_website"
                placeholder="Website"
                value={fk.values.phase_website}
                onChange={fk.handleChange}
              />
            </div>
            <div>
              <p className="font-bold">Description</p>
              <TextField
                fullWidth
                id="phase_description"
                name="phase_description"
                placeholder="Description"
                value={fk.values.phase_description}
                onChange={fk.handleChange}
              />
            </div>

            <div>
              <p className="font-bold">Floor Plan PDF</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  fk.setFieldValue(
                    'phase_floor_plans',
                    e.currentTarget.files[0]
                  )
                }
                className="border border-gray-400 p-4 rounded !w-full"
              />
            </div>

            <div>
              <p className="font-bold">Brochure PDF</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  fk.setFieldValue('phase_brouchure', e.currentTarget.files[0])
                }
                className="border border-gray-400 p-4 rounded !w-full"
              />
            </div>

            <div>
              <p className="font-bold">Details PDF</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  fk.setFieldValue('phase_details', e.currentTarget.files[0])
                }
                className="border border-gray-400 p-4 rounded !w-full"
              />
            </div>

            <CustomCircularProgress isLoading={loading} />
          </div>

          <div className="flex justify-end gap-3 mt-2">
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

export default Addphase;
