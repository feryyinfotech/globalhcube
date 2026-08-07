import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// Pipeline mix donut — driven by the same bucket counts EmpDashboard already
// fetches from get-dashboard-data-emp, so no separate data fetch here.
const EmpChart = ({ stats = {} }) => {
  const {
    newCnt = 0,
    coldCnt = 0,
    warmCnt = 0,
    hotCnt = 0,
    closeCnt = 0,
    convertCnt = 0,
  } = stats;
  const total = newCnt + coldCnt + warmCnt + hotCnt + closeCnt + convertCnt;

  const toPct = (cnt) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

  const data = [
    { name: "New", value: toPct(newCnt), color: "#3B82F6" },
    { name: "Cold", value: toPct(coldCnt), color: "#06B6D4" },
    { name: "Warm", value: toPct(warmCnt), color: "#F59E0B" },
    { name: "Hot", value: toPct(hotCnt), color: "#EF4444" },
    { name: "Closed", value: toPct(closeCnt), color: "#123B7A" },
    { name: "Converted", value: toPct(convertCnt), color: "#059669" },
  ];

  return (
    <div className='card_chart'>
      <div className='headsse'>
        <div>
          <h5>Pipeline mix</h5>
          <p>Where all {total} leads are sitting right now.</p>
        </div>
      </div>
      <div className="pipeline-content chart_body mt-5">
        <div className="donut-chart">
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="center-text">
            <h2>{total}</h2>
            <span>LEADS</span>
          </div>
        </div>

        <div className="pipeline-legend">
          {data.map((item) => (
            <div className="legend-row" key={item.name}>
              <div className="legend-left">
                <span
                  className="legend-dot"
                  style={{ background: item.color }}
                />
                {item.name}
              </div>

              <strong>{item.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmpChart;
