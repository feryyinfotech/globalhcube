import { Edit, RemoveRedEyeTwoTone } from "@mui/icons-material";
import Dialog from "@mui/material/Dialog";
import React, { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URLS } from "../../config/APIUrls";
import axiosInstance from "../../config/axios";
import CustomCircularProgress from "../../Shared/CustomDialogBox"; // Spinner
import CustomTable from "../../Shared/CustomTable";
import CustomToPagination from "../../Shared/CustomToPagination";
import { baseUrl } from "../../URL";
import { Switch } from "@mui/material";

const Allphase = () => {
    const [page, setPage] = useState(0);
    const [openImg, setOpenImg] = useState(false);
    const [imgSrc, setImgSrc] = useState("");
    const location = useLocation();
    const phasedata = location?.state || null
    const navigate = useNavigate()
    const client = useQueryClient();
    const { data: Phasedata, loading } = useQuery(
        ["all_phase", phasedata?.pro_id],
        () => axiosInstance.get(`${API_URLS.project_phase_details_by_id}?project_id=${phasedata?.pro_id}`),
        {
            enabled: !!phasedata?.pro_id,
        }
    );

    const project = Phasedata?.data?.response?.[0]?.project_details;
    const phaseList = Phasedata?.data?.response?.[0]?.phase_details || [];

    const phasestatusFn = async (phaseId, currentStatus) => {
        try {
            await axiosInstance.get(API_URLS.update_phase_status, {
                params: {
                    phase_id: phaseId,
                    status: !currentStatus,
                }
            });
            client.refetchQueries("all_phase")

        } catch (error) {
            console.error("Status update failed:", error);
        }
    };


    const projectTableHead = [
        <span>S.No</span>,
        <span>Title</span>,
        <span>Sort Description</span>,
        <span>Full Description</span>,
        <span>Image</span>,
    ];

    const handleImageClick = (src) => {
        setImgSrc(src);
        setOpenImg(true);
    };

    const projectTableRow = [
        [
            <span>1</span>,
            <span>{project?.pro_title || "-"}</span>,
            <span>{project?.pro_sort_description || "-"}</span>,
            <span>{project?.pro_full_description || "-"}</span>,
            <span className="!flex justify-center">
                <img
                    src={`${baseUrl}${project?.pro_image}`}
                    alt="project"
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => handleImageClick(`${baseUrl}${project?.pro_image}`)}
                />
            </span>,
        ]
    ];



    const phaseTableHead = [
        <span>S.No</span>,
        <span>Direction</span>,
        <span>Website</span>,
        <span>Description</span>,
        <span>Details</span>,
        <span>Floor Plan</span>,
        <span>Brochure</span>,
        <span>Status</span>,
        <span>Action</span>,
    ];

    const phaseTableRow = phaseList.map((i, index) => {
        return [
            <span>{index + 1}</span>,
            <span>{i?.phase_direction || "-"}</span>,
            <span>{i?.phase_website || "-"}</span>,
            <span>{i?.phase_description || "-"}</span>,
            <span>
                {i?.phase_details ? (
                    <Link to={`${baseUrl}${i.phase_details}`} target="_blank" rel="noreferrer">
                        <RemoveRedEyeTwoTone className="!cursor-pointer !text-blue-600" />
                    </Link>
                ) : "-"}
            </span>,
            <span>
                {i?.phase_floor_plans ? (
                    <Link to={`${baseUrl}${i.phase_floor_plans}`} target="_blank" rel="noreferrer">
                        <RemoveRedEyeTwoTone className="!cursor-pointer !text-red-600" />
                    </Link>
                ) : "-"}
            </span>,
            <span>
                {i?.phase_brouchure ? (
                    <Link to={`${baseUrl}${i.phase_brouchure}`} target="_blank" rel="noreferrer">
                        <RemoveRedEyeTwoTone className="!cursor-pointer !text-green-600" />
                    </Link>
                ) : "-"}
            </span>,
            <span>
                <Switch
                    checked={i.phase_status === "Deactive" ? false : true}
                    onChange={() => phasestatusFn(i.phase_id, i.phase_status)}
                    color="primary"
                />
            </span>,
            <span>
                <Edit onClick={() => navigate(`/phase_create`, { state: { ...i, phase_id: i?.phase_id } })} />
            </span>,

        ];
    });

    return (
        <div className="p-4 space-y-6 relative">
            <CustomCircularProgress isLoading={loading} />

            <Dialog open={openImg} onClose={() => setOpenImg(false)} maxWidth="md">
                <img src={imgSrc} alt="zoomed" className="w-full h-auto" />
            </Dialog>
            {project && (
                <div>
                    <h2 className="text-lg font-bold mb-2">Project Details</h2>
                    <CustomTable
                        tablehead={projectTableHead}
                        tablerow={projectTableRow}
                        isLoading={loading}
                    />
                </div>
            )}

            {/* Phase Table */}
            <div>
                <h2 className="text-lg font-bold mb-2">Phase Details</h2>
                <div className="flex justify-end mb-4">
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        onClick={() => navigate("/phase_create", { state: { pro_id: phasedata?.pro_id } })}
                    >
                        Add Phase
                    </button>
                </div>

                <CustomTable
                    tablehead={phaseTableHead}
                    tablerow={phaseTableRow}
                    isLoading={loading}
                />
                <CustomToPagination setPage={setPage} page={page} data={phaseList} />
            </div>
        </div>
    );
};

export default Allphase;
