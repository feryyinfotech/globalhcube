import { FilterAlt } from '@mui/icons-material';
import { Button, Switch, TextField, Typography } from '@mui/material';
import { useFormik } from 'formik';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import CustomTable from '../../Shared/CustomTable';
import CustomToPagination from '../../Shared/CustomToPagination';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
const FailedList = () => {
  const [loading, setloding] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const client = useQueryClient();
  const [openRowId, setOpenRowId] = useState(null);
  const [showAccordion, setShowAccordion] = useState(false);

  const initialValue = {
    search: '',
    start_date: '',
    end_date: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
  });

  const { data: list } = useQuery(['list', page, rowsPerPage, fk], () => {
    const reqBody = {
      search: fk.values.search,
      start_date: fk.values.start_date,
      end_date: fk.values.end_date,
    };
    const response = axiosInstance.post(API_URLS.failed_list, {
      ...reqBody,
      page: page,
      count: rowsPerPage,
    });
    return response;
  });
  const data = list?.data?.response || [];
  console.log(data);

  // const LeadstatusFn = async (id) => {
  //   try {
  //     const response = await axiosInstance.get(
  //       `${API_URLS.lead_source_status}?ld_src_id=${id}`
  //     );
  //     toast(response?.data?.msg);
  //     client.refetchQueries('lead_data_source');
  //   } catch (e) {
  //     console.log('something went wrong');
  //   }
  // };

  const tablehead = [
    <span>S.No</span>,
    <span>Title</span>,
    <span>Status</span>,
  ];

  const tablerow = data?.data?.map((i, index) => {
    return [
      <Accordion>
        <span>{index + 1}</span>,<span>{i?.fail_title}</span>,
        <span>
          <Switch
            // onClick={() => LeadstatusFn(i?.ld_src_id)}
            checked={i?.ld_src_status === 'Deactive' ? false : true}
          />
        </span>
        ,
      </Accordion>,
    ];
  });

  return (
    <div>
      <div className="grid grid-cols-2 sm:flex gap-3 md:gap-3  px-3 py-2 bg-[#EBE9FD]">
        <div className="flex ">
          <span className="text-xs text-center mr-3">From:</span>
          <TextField
            size="small"
            type="date"
            id="start_date"
            name="start_date"
            value={fk.values.start_date}
            onChange={fk.handleChange}
            className="!min-w-[110px]  !md:min-w-[200px]"
            InputProps={{
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
            placeholder="Search by user id"
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
      <div>
        <div className="!w-full grid grid-cols-3">
          <span>S.No</span>
          <span>Title</span>
          <span>Status</span>
        </div>
        <Accordion>
          <AccordionSummary
            expandIcon={<ArrowDownwardIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <div className="!w-full grid grid-cols-3">
              <span></span>
              <span></span>
              <span>
                <Switch
                // onClick={() => LeadstatusFn(i?.ld_src_id)}
                // checked={i?.ld_src_status === 'Deactive' ? false : true}
                />
              </span>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse malesuada lacus ex, sit amet blandit leo lobortis
              eget.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </div>
      <CustomToPagination setPage={setPage} page={page} data={data} />
    </div>
  );
};

export default FailedList;
