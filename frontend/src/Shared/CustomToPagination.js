import React from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { IconButton } from "@mui/material";
const CustomToPagination = ({ setPage, page, data }) => {
  return (
    <div className="Paginations w-full flex items-center justify-between">
      <ul>
        <li>Total Pages: <span>{data?.totalPage}</span></li>
      </ul>
      <div className="nesxt_btns">
          <IconButton className="btn_nex_prev"
            onClick={() => setPage(page - 1 > 0 ? page - 1 : 1)} >
            <ChevronLeftIcon className="text-text-color" />
          </IconButton>

          <span>{data?.currPage}</span>

          <IconButton className="btn_nex_prev"
            onClick={() =>
              setPage(page + 1 < data?.totalPage ? page + 1 : data?.totalPage)
            } >
            <ChevronRightIcon className="text-text-color" />
          </IconButton>
      </div>
    </div>
  );
};

export default CustomToPagination;
