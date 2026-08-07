import { Button, TextField } from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/CustomDialogBox';
import { baseUrl } from '../../URL';

// Project create/update form — name, short description, full description, image.
// Used inside a modal from Projectlist.jsx
const CreateProject = ({ project, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const fk = useFormik({
    initialValues: {
      pro_title: project?.pro_title || '',
      pro_sort_description: project?.pro_sort_description || '',
      pro_full_description: project?.pro_full_description || '',
      file: null,
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const formData = new FormData();
      formData.append('pro_title', values.pro_title);
      formData.append('pro_sort_description', values.pro_sort_description);
      formData.append('pro_full_description', values.pro_full_description);
      if (values.file) {
        formData.append('file', values.file);
      }
      if (project?.pro_id) {
        formData.append('pro_id', project.pro_id);
      }
      mutate(formData);
    },
  });

  const { mutate } = useMutation(
    async (formData) => {
      setLoading(true);
      return project?.pro_id
        ? axiosInstance.post(API_URLS.update_project_details, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : axiosInstance.post(API_URLS.add_project_details, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
    },
    {
      onSuccess: (response) => {
        const msg = response?.data?.msg;
        const success = response?.data?.success;
        toast(msg);
        if (success) {
          fk.resetForm();
          onSuccess?.();
          onClose?.();
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
      <div className="w-full p-2">
        <p className="!text-center font-bold text-lg mb-2">
          {project?.pro_id ? 'Update' : 'Add'} Products
        </p>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-[6%] gap-y-6 p-5 w-full">
          <div>
            <p className="font-bold">Title</p>
            <TextField
              fullWidth
              id="pro_title"
              name="pro_title"
              placeholder="Product Title"
              value={fk.values.pro_title}
              onChange={fk.handleChange}
              className="bg-[#EBE9FD]"
            />
          </div>

          <div>
            <p className="font-bold">Short Description</p>
            <TextField
              fullWidth
              id="pro_sort_description"
              name="pro_sort_description"
              placeholder="Short Description"
              value={fk.values.pro_sort_description}
              onChange={fk.handleChange}
              className="bg-[#EBE9FD]"
            />
          </div>

          <div>
            <p className="font-bold">Upload Image</p>
            <input
              className="border border-gray-400 p-4 rounded w-full bg-[#EBE9FD]"
              type="file"
              accept="image/*"
              onChange={(event) => {
                fk.setFieldValue('file', event.currentTarget.files[0]);
              }}
            />
            {project?.pro_image && !fk.values.file && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Current image:</span>
                <img
                  src={`${baseUrl}${project.pro_image}`}
                  alt=""
                  className="h-10 w-10 rounded object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <p className="font-bold">Full Description</p>
            <TextField
              fullWidth
              id="pro_full_description"
              name="pro_full_description"
              placeholder="Full Description"
              value={fk.values.pro_full_description}
              onChange={fk.handleChange}
              className="bg-[#EBE9FD]"
              multiline
              rows={2}
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
            disabled={!fk.values.pro_title?.trim()}
            variant="contained"
            className="!bg-gradient-to-b from-[#E64F4F] to-[#FFAFAF]"
          >
            {project?.pro_id ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </>
  );
};

export default CreateProject;