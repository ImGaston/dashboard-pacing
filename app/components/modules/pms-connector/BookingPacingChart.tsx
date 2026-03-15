"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { BookingPacingMonthBar } from "@/app/utils/bookingPacingUtils";

interface BookingPacingChartProps {
  data: BookingPacingMonthBar[];
  currentLabel: string;
  previousLabel: string;
}

const COLOR_CURRENT = "#13342D"; // cedar
const COLOR_PREVIOUS = "#76574C"; // walnut

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const current = payload.find((p: any) => p.dataKey === "currentRevenue")?.value || 0;
  const previous = payload.find((p: any) => p.dataKey === "previousRevenue")?.value || 0;
  const delta = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const deltaColor = delta >= 0 ? "text-success" : "text-error";

  return (
    <div className="bg-bone-light p-3 border border-bone-dark shadow-[0_4px_12px_rgba(22,25,16,0.08)] rounded-lg text-xs">
      <p className="font-bold text-onyx mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-cedar" />
        <span className="text-moss">Current:</span>
        <span className="font-mono font-medium">
          ${current.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2 border-b border-bone-dark pb-2">
        <span className="w-2 h-2 rounded-full bg-walnut" />
        <span className="text-moss">Previous:</span>
        <span className="font-mono font-medium">
          ${previous.toLocaleString()}
        </span>
      </div>
      {previous > 0 && (
        <div className="flex justify-between items-center pt-1">
          <span className="text-walnut font-medium">Change:</span>
          <span className={`font-bold ${deltaColor}`}>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function BookingPacingChart({
  data,
  currentLabel,
  previousLabel,
}: BookingPacingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-moss text-sm">
        No data to display for the selected period.
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.1}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#5D6D59", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#5D6D59",
              fontSize: 12,
              fontFamily: '"JetBrains Mono", monospace',
            }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "transparent" }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-moss text-sm font-medium ml-1">
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="currentRevenue"
            name={currentLabel}
            fill={COLOR_CURRENT}
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar
            dataKey="previousRevenue"
            name={previousLabel}
            fill={COLOR_PREVIOUS}
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
