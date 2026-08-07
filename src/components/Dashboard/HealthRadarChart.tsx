import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

function HealthRadarChart({ radarData }: { radarData: any[] }) {
  return (
    <div className="w-full h-[300px] min-h-[300px]">
      <ResponsiveContainer width="100%" height={300} minWidth={0}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 700 }}
        />
        <Radar
          name="Health"
          dataKey="A"
          stroke="#6366F1"
          fill="#6366F1"
          fillOpacity={0.4}
        />
      </RadarChart>
    </ResponsiveContainer>
    </div>
  );
}

export default React.memo(HealthRadarChart);
