"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import type { RevenueEntry } from "@/types";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const COLORS = ["#13342D", "#76574C", "#5D6D59", "#3F261F"]; // cedar, walnut, moss, tobacco

interface RevenueTrendChartProps {
  entries: RevenueEntry[];
  selectedProperty: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bone-light p-3 border border-bone-dark shadow-[0_1px_3px_rgba(22,25,16,0.06)] rounded-[12px] text-xs">
        <p className="font-bold text-onyx mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-moss">{p.name}:</span>
            <span className="font-mono font-medium">
              ${Number(p.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueTrendChart({ entries, selectedProperty }: RevenueTrendChartProps) {
  const { chartData, propertyNames } = useMemo(() => {
    if (entries.length === 0) return { chartData: [], propertyNames: [] };

    // Get unique properties
    const properties = Array.from(new Set(entries.map((e) => e.propertyName))).sort();

    // Get unique time periods, sorted chronologically
    const periods = Array.from(
      new Set(entries.map((e) => `${e.year}-${String(e.month).padStart(2, "0")}`))
    ).sort();

    // Build chart data
    const data = periods.map((period) => {
      const [year, month] = period.split("-").map(Number);
      const label = `${MONTH_SHORT[month - 1]} ${year}`;
      const point: Record<string, any> = { label };

      if (selectedProperty === "all") {
        // Multi-line: one key per property
        properties.forEach((prop) => {
          const entry = entries.find(
            (e) => e.propertyName === prop && e.year === year && e.month === month
          );
          point[prop] = entry ? entry.totalRevenue : null;
        });
      } else {
        // Single property
        const entry = entries.find(
          (e) => e.propertyName === selectedProperty && e.year === year && e.month === month
        );
        point["Revenue"] = entry ? entry.totalRevenue : null;
      }

      return point;
    });

    return {
      chartData: data,
      propertyNames: selectedProperty === "all" ? properties : ["Revenue"],
    };
  }, [entries, selectedProperty]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-moss text-sm">Add entries to see the revenue trend chart.</p>
          </div>
        ) : (
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
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
                  tick={{ fill: "#5D6D59", fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                {propertyNames.length > 1 && (
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-moss text-sm font-medium ml-1">{value}</span>
                    )}
                  />
                )}
                {propertyNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    name={name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
