import React, { useMemo } from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { getMonth, getYear, subYears, startOfDay, isBefore, isSameDay } from 'date-fns';
import type { Reservation } from '../types';

interface PacingSnapshotChartProps {
    data: Reservation[];
    referenceDate?: Date;
}

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Colors
const COLOR_OTB_2026 = "#10b981"; // Emerald-500
const COLOR_STLY_2025 = "#9ca3af"; // Gray-400
const COLOR_FINAL_2025 = "#374151"; // Gray-700 (Charcoal)

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const otb2026 = payload.find((p: any) => p.dataKey === 'revenue2026OTB')?.value || 0;
        const stly2025 = payload.find((p: any) => p.dataKey === 'revenue2025STLY')?.value || 0;
        const final2025 = payload.find((p: any) => p.dataKey === 'revenue2025Final')?.value || 0;

        const pace = stly2025 > 0 ? ((otb2026 - stly2025) / stly2025) * 100 : 0;
        const paceColor = pace >= 0 ? 'text-emerald-600' : 'text-red-500';

        return (
            <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-lg text-xs">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-gray-600">2026 OTB:</span>
                    <span className="font-mono font-medium">${otb2026.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span className="text-gray-600">2025 STLY:</span>
                    <span className="font-mono font-medium">${stly2025.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                    <span className="w-2 h-2 rounded-full bg-gray-700"></span>
                    <span className="text-gray-600">2025 Final:</span>
                    <span className="font-mono font-medium">${final2025.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-500 font-medium">Pace (vs STLY):</span>
                    <span className={`font-bold ${paceColor}`}>
                        {pace > 0 ? "+" : ""}{pace.toFixed(1)}%
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export const PacingSnapshotChart: React.FC<PacingSnapshotChartProps> = ({ data, referenceDate = new Date() }) => {
    const chartData = useMemo(() => {
        const stlyDate = subYears(referenceDate, 1);

        // Initialize monthly data
        const monthlyData = MONTHS.map(month => ({
            month,
            revenue2026OTB: 0,
            revenue2025STLY: 0,
            revenue2025Final: 0
        }));

        data.forEach(res => {
            const checkInYear = getYear(res.checkInDate);
            const monthIndex = getMonth(res.checkInDate);
            const bookingDate = startOfDay(res.reservationDate); // Normalise to start of day for accurate comparison
            const revenue = res.revenue;

            // 2026 OTB: Checkin 2026 AND Booking <= Reference Date
            if (checkInYear === 2026) {
                if (isBefore(bookingDate, referenceDate) || isSameDay(bookingDate, referenceDate)) {
                    monthlyData[monthIndex].revenue2026OTB += revenue;
                }
            }

            // 2025 STLY: Checkin 2025 AND Booking <= (Reference Date - 1 Year)
            if (checkInYear === 2025) {
                if (isBefore(bookingDate, stlyDate) || isSameDay(bookingDate, stlyDate)) {
                    monthlyData[monthIndex].revenue2025STLY += revenue;
                }
                // 2025 Final: Checkin 2025 (No booking date filter)
                monthlyData[monthIndex].revenue2025Final += revenue;
            }
        });

        return monthlyData;
    }, [data, referenceDate]);

    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-gray-600 text-sm font-medium ml-1">{value}</span>}
                    />
                    <Bar
                        dataKey="revenue2026OTB"
                        name="2026 OTB"
                        fill={COLOR_OTB_2026}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                    <Bar
                        dataKey="revenue2025STLY"
                        name="2025 STLY"
                        fill={COLOR_STLY_2025}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                    {/* Render Line after Bars to be on top */}
                    <Line
                        type="monotone"
                        dataKey="revenue2025Final"
                        name="2025 Final"
                        stroke={COLOR_FINAL_2025}
                        strokeWidth={2}
                        dot={{ r: 3, fill: COLOR_FINAL_2025, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
