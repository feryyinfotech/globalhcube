import React from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Cell,
    LabelList,
} from "recharts";
import { useQuery } from "react-query";
import axiosInstance from "../../config/axios";
import { API_URLS } from "../../config/APIUrls";

const BAR_COLORS = ["#2E7BEF", "#4F92F2", "#7FB0F6", "#A9CBF9", "#CFE2FC"];

const LeadSourceChart = () => {
    const { data: sourceData } = useQuery(
        ["lead_source_breakdown_emp"],
        () => axiosInstance.get(API_URLS.lead_source_breakdown_emp),
        { refetchOnWindowFocus: false }
    );
    const rows = sourceData?.data?.response || [];
    const data = rows.map((row, index) => ({
        name: row.ld_src_name || "Unknown",
        value: Number(row.cnt) || 0,
        color: BAR_COLORS[index % BAR_COLORS.length],
    }));

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const topPercent =
        total > 0 && data.length > 0
            ? Math.round((data[0].value / total) * 100)
            : 0;
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="card_chart">
            <div className="headsse">
                <div>
                    <h5>Where leads come from</h5>
                    <p>Sources of the {total} leads added this month.</p>
                </div>
            </div>
            <div className="chart_body scroll_height">
                {data.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={data}
                                margin={{ top: 25, right: 10, left: 0, bottom: 20 }}
                            >
                                <CartesianGrid
                                    vertical={false}
                                    stroke="#E8EEF6"
                                    strokeDasharray="0"
                                />

                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748B", fontSize: 12 }}
                                />

                                <YAxis hide domain={[0, maxValue]} />

                                <Bar
                                    dataKey="value"
                                    radius={[8, 8, 0, 0]}
                                    barSize={42}
                                >
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        style={{
                                            fill: "#123B7A",
                                            fontWeight: 700,
                                            fontSize: 13,
                                        }}
                                    />

                                    {data.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <div className="lead-footer">
                            {data[0].name} brings in{" "}
                            <strong>{topPercent}%</strong> of new leads
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-center mt-5">
                        No leads added this month yet.
                    </p>
                )}
            </div>
        </div>
    );
};

export default LeadSourceChart;
