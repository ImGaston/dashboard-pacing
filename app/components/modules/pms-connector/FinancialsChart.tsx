"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import type { PMSFinancialMonth } from "@/types";

interface FinancialsChartProps {
  financials: PMSFinancialMonth[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-lg text-xs">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cedar" />
          <span className="text-gray-600">Revenue:</span>
          <span className="font-mono font-medium">
            ${Number(payload[0].value).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function FinancialsChart({ financials, loading }: FinancialsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="animate-pulse">
            <div className="h-[350px] bg-bone rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        {financials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-moss text-sm">
              No financial data available yet.
            </p>
          </div>
        ) : (
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financials}
                margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.1}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `$${(value / 1000).toFixed(0)}k`
                      : `$${value}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  fill="#13342D"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
