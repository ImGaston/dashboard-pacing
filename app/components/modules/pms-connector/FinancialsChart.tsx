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
      <div className="bg-bone-light p-3 border border-bone-dark shadow-[0_1px_3px_rgba(22,25,16,0.06)] rounded-[12px] text-xs">
        <p className="font-bold text-onyx mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cedar" />
          <span className="text-moss">Revenue:</span>
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
            <div className="h-[350px] bg-bone-muted rounded" />
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
                  tick={{ fill: "#5D6D59", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#5D6D59", fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}
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
