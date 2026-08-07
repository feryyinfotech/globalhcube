import {
  FilterAlt,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import { toLocalMoment } from '../../utils/dateUtils';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { API_URLS } from '../../config/APIUrls';
import axiosInstance from '../../config/axios';
import CustomToPagination from '../../Shared/CustomToPagination';
import CustomCircularProgress from '../../Shared/loder/CustomCircularProgress';

const Master = () => {
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState('');
  const [loading, setloading] = useState(false);
  const [data, setData] = useState([]);
  const [active, setActive] = useState(null);
  const [value, setValue] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [openRow, setOpenRow] = useState(null);

  const handleRowToggle = (index) => {
    setOpenRow(openRow === index ? null : index);
  };

  const handleSubmit = () => {
    if (project.trim()) {
      setData([...data, { title: project, reasons: [] }]);
      setProject('');
      setOpen(false);
    }
  };

  const handleValueSubmit = (index) => {
    if (value.trim()) {
      const updatedData = [...data];
      updatedData[index].reasons.push(value);
      setData(updatedData);
      setValue('');
      setActive(null);
    }
  };
  const addfailed = async (title, reasons) => {
    const reqbody = {
      fail_title: title,
      reasons: reasons,
    };
    try {
      const res = await axiosInstance.post(API_URLS.add_failedtitle, reqbody);
      // console.log(res?.data);
    } catch (error) {
      console.error('Title added failed:', error);
    }
  };

  const handleFinalSubmit = () => {
    const lastItem = data[data.length - 1];
    if (lastItem?.title && lastItem?.reasons.length > 0) {
      addfailed(lastItem.title, lastItem.reasons);
      toast('Data Saved Successfully');
    } else {
      console.log('No title or reasons available.');
    }
  };
  const initialValue = {
    search: '',
    start_date: '',
    end_date: '',
  };

  const fk = useFormik({
    initialValues: initialValue,
    enableReinitialize: true,
  });
  const { data: FialedList } = useQuery(
    ['failed_data', page, rowsPerPage, fk.values],
    () => {
      const reqBody = {
        search: fk.values.search,
        start_date: fk.values.start_date,
        end_date: fk.values.end_date,
      };
      const url = API_URLS.get_failed_list;
      return axiosInstance.post(url, {
        ...reqBody,
        page: page,
        count: rowsPerPage,
      });
    }
  );

  const datafialedlist = FialedList?.data?.response || [];

  return (
    <div className="p-1">
      <CustomCircularProgress isLoading={loading} />
      <Button
        className="!bg-[#EBE9FD] !text-black !font-semibold !mb-2 !p-3 "
        onClick={() => setOpen(true)}
      >
        Add Failed Title +
      </Button>

      <div className="flex flex-col mx-5 w-full">
        {data.map((item, index) => (
          <div key={index} className="">
            <div className="flex items-center gap-4">
              <p> {index + 1} - </p>
              <p
                className="!border flex justify-between !bg-[#EBE9FD]  w-[40%]  !p-2 !rounded  cursor-pointer"
                onClick={() => setActive(index)}
              >
                {' '}
                {item.title} <span>+</span>
              </p>
            </div>
            {active === index && (
              <div className=" my-3 ">
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter reason..."
                  className="border  !bg-[#EBE9FD] px-2 py-1 rounded !ml-8 "
                />

                <div className="flex justify-center">
                  <button
                    onClick={() => handleValueSubmit(index)}
                    className=" text-white px-4 py-2 mt-2 rounded !bg-gradient-to-b from-[#7981F9] to-[#5E60D0]"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
            {item.reasons.length > 0 && (
              <ul className="ml-16 mt-1 list-disc">
                {item.reasons.map((reason, i) => (
                  <li key={i} className="text-gray-700">
                    {reason}
                  </li>
                ))}
                <div className="flex justify-around m-4">
                  <button
                    onClick={() => handleFinalSubmit()}
                    className=" text-white px-4 py-2 rounded !bg-gradient-to-b from-[#E64F4F] to-[#FFAFAF]"
                  >
                    Submit
                  </button>
                </div>
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-3 md:flex  px-3 py-2 !bg-[#EBE9FD]">
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
        <div className="flex ml-2">
          <span className="text-xs text-center mr-1">To:</span>
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
            placeholder="Search ......"
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
            startIcon={<FilterAlt />}
          >
            Filter
          </Button>
        </div>
      </div>
      <Table
        stickyHeader
        aria-label="sticky table"
        sx={{
          borderCollapse: 'separate',
          borderSpacing: '0 9px',
        }}
      >
        <TableHead className="!bg-[#EBE9FD] ">
          <TableRow>
            <TableCell className="!text-black !font-bold !bg-[#EBE9FD]  !text-center">
              S.No
            </TableCell>
            <TableCell className="!text-black !font-bold !bg-[#EBE9FD]  !text-center">
              Failed Title
            </TableCell>
            <TableCell className="!text-black !font-bold !bg-[#EBE9FD]  !text-center">
              Date
            </TableCell>
            <TableCell className="!text-black !font-bold !bg-[#EBE9FD]  !text-center">
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody className="!bg-[#EBE9FD] ">
          {datafialedlist?.data?.length > 0 ? (
            datafialedlist.data.map((item, index) => (
              <React.Fragment key={item.fail_id}>
                {/* Main Row */}
                <TableRow>
                  <TableCell className="!text-black  !bg-[#EBE9FD]  !text-center">
                    {index + 1}
                  </TableCell>
                  <TableCell className="!text-black  !bg-[#EBE9FD]  !text-center">
                    {item.fail_title}
                  </TableCell>
                  <TableCell className="!text-black  !bg-[#EBE9FD]  !text-center">
                    {toLocalMoment(item.fail_created_at).format('DD-MM-YYYY')}
                  </TableCell>
                  <TableCell className="!text-black  !bg-[#EBE9FD]  !text-center">
                    <IconButton
                      onClick={() => handleRowToggle(index)}
                      aria-label="expand row"
                      size="small"
                    >
                      {openRow === index ? (
                        <KeyboardArrowUp />
                      ) : (
                        <KeyboardArrowDown />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>

                {/* Expanded Row with Sub Reasons Table */}
                <TableRow>
                  <TableCell
                    className="!text-black !font-bold !bg-[#EBE9FD]  !text-center"
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={6}
                  >
                    <Collapse
                      in={openRow === index}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box margin={2}>
                        <Typography variant="subtitle1" gutterBottom>
                          Sub Reasons:
                        </Typography>

                        {item.sub_reasons?.length > 0 &&
                        item.sub_reasons[0]?.['`fl_s_id`'] !== null ? (
                          <Table
                            stickyHeader
                            aria-label="sticky table"
                            sx={{
                              borderCollapse: 'separate',
                              borderSpacing: '0 9px',
                            }}
                          >
                            <TableHead className="!bg-[#EBE9FD] ">
                              <TableRow>
                                <TableCell className="!text-black !font-bold !bg-[#EBE9FD]  !text-center">
                                  S.No
                                </TableCell>
                                <TableCell className="!text-black !font-bold !bg-[#EBE9FD]  !text-center">
                                  Sub Reasons Title
                                </TableCell>
                                <TableCell className="!text-black !font-bold !bg-[#EBE9FD]  !text-center">
                                  Date
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {item.sub_reasons.map((reason, i) => (
                                <TableRow key={i}>
                                  <TableCell className="!text-black  !bg-[#EBE9FD]  !text-center">
                                    {i + 1}
                                  </TableCell>
                                  <TableCell className="!text-black  !bg-[#EBE9FD]  !text-center">
                                    {reason?.['`fl_s_title`'] ?? 'No title'}
                                  </TableCell>
                                  <TableCell className="!text-black  !bg-[#EBE9FD]  !text-center">
                                    {toLocalMoment(
                                      reason?.['`fl_s_created_at`']
                                    ).format('DD-MM-YYYY')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography>No sub reasons available.</Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="!text-center !text-black">
                No data found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <CustomToPagination setPage={setPage} page={page} data={datafialedlist} />
      {open && (
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Failed Title</DialogTitle>
          <DialogContent>
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Enter Title"
              className="!border !border-gray-500 !bg-[#EBE9FD] text-center p-1 w-full my-4"
            />

            <Button
              className="!bg-gradient-to-b from-[#E64F4F] to-[#FFAFAF] !w-full !text-white"
              onClick={handleSubmit}
              disabled={!project}
            >
              Add Title
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Master;
