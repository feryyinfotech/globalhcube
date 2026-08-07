import { Add, Edit, FilterAlt, Search as SearchIcon } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogContent,
  InputAdornment,
  TextField,
} from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';
import CustomToPagination from '../../Shared/CustomToPagination';
import CreateProject from './Addproject'; // adjust path if needed
import { baseUrl } from '../../URL';

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

const Projectlist = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [openModal, setOpenModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // null = create mode
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

  const { isLoading, data: Projectlistdata } = useQuery(
    [
      'all_project_list',
      page,
      rowsPerPage,
      fk.values.search,
      fk.values.start_date,
      fk.values.end_date,
    ],
    () => {
      const reqBody = {
        search: fk.values.search,
        start_date: fk.values.start_date,
        end_date: fk.values.end_date,
      };
      return axiosInstance.post(API_URLS.project_details, {
        ...reqBody,
        page,
        count: rowsPerPage,
      });
    }
  );
  const data = Projectlistdata?.data?.response || [];
  const rows = data?.data || [];

  const openCreate = () => {
    setEditingProject(null);
    setOpenModal(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setOpenModal(true);
  };

  return (
    <div className="p-3 md:p-6">
      <CustomCircularProgress isLoading={isLoading} />
      {/* Page header */}
      <div className="breadcruumb_section">
        <div class="breadcrumb_content">
          <h3>Products</h3>
          <p>{data?.total_count ?? rows.length} project{rows.length === 1 ? '' : 's'}</p>
        </div>
        <div className='breadcrumb_serch'>
          <Button className="btn btn-primary"
            onClick={openCreate}
            variant="contained"
            startIcon={<Add sx={{ fontSize: 18 }} />}>
            Add Product
          </Button>
        </div>
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
                <th>Product Name</th>
                <th>Short Description</th>
                <th>Full Description</th>
                <th>Image</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((i, index) => (
                  <tr
                    key={i?.pro_id ?? index}>
                    <td >
                      {(page - 1) * rowsPerPage + index + 1}
                    </td>
                    <td>
                      {i?.pro_title}
                    </td>
                    <td className=" truncate" style={{ color: '#374151' }}>
                      {i?.pro_sort_description || <span style={{ color: MUTED }}>—</span>}
                    </td>
                    <td className="max-w-[280px] truncate" style={{ color: '#374151' }}>
                      {i?.pro_full_description || <span style={{ color: MUTED }}>—</span>}
                    </td>
                    <td>
                      {i?.pro_image ? (
                        <img
                          src={`${baseUrl}${i.pro_image}`}
                          alt={i?.pro_title || 'project'}
                          className="h-10 w-10 rounded object-cover border"
                          style={{ borderColor: BORDER }}
                        />
                      ) : (
                        <span className="text-xs" style={{ color: MUTED }}>
                          No image
                        </span>
                      )}
                    </td>
                    <td >
                      <Edit
                        className="cursor-pointer"
                        sx={{ fontSize: 20, color: ACCENT }}
                        onClick={() => openEdit(i)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: MUTED }}>
                    No projects found. Try adjusting your filters or{' '}
                    <button
                      onClick={openCreate}
                      className="font-semibold underline"
                      style={{ color: ACCENT }}
                    >
                      add a new project
                    </button>
                    .
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

     

      {/* Create / rename project modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <CreateProject
            project={editingProject}
            onClose={() => setOpenModal(false)}
            onSuccess={() => client.refetchQueries('all_project_list')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projectlist;