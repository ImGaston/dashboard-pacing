"use client";

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
import type { Reservation } from '@/types';

interface PacingSnapshotChartProps {
    data: Reservation[];
    referenceDate?: Date;
}

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Colors — brand palette
const COLOR_OTB_2026 = "#13342D"; // Cedar
const COLOR_STLY_2025 = "#76574C"; // Walnut
const COLOR_FINAL_2025 = "#5D6D59"; // Moss

const CustomTooltip = ({ active, payload, label, currentYear, prevYear }: any) => {
    if (active && payload && payload.length) {
        const otbCurrent = payload.find((p: any) => p.dataKey === 'revenueCurrentOTB')?.value || 0;
        const stlyPrev = payload.find((p: any) => p.dataKey === 'revenuePrevSTLY')?.value || 0;
        const finalPrev = payload.find((p: any) => p.dataKey === 'revenuePrevFinal')?.value || 0;

        const pace = stlyPrev > 0 ? ((otbCurrent - stlyPrev) / stlyPrev) * 100 : 0;
        const paceColor = pace >= 0 ? 'text-success' : 'text-error';

        return (
            <div className="bg-bone-light p-3 border border-bone-dark shadow-[0_4px_12px_rgba(22,25,16,0.08)] rounded-lg text-xs">
                <p className="font-bold text-onyx mb-2">{label}</p>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-cedar"></span>
                    <span className="text-moss">{currentYear} OTB:</span>
                    <span className="font-mono font-medium">${otbCurrent.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-walnut"></span>
                    <span className="text-moss">{prevYear} STLY:</span>
                    <span className="font-mono font-medium">${stlyPrev.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 mb-2 border-b border-bone-dark pb-2">
                    <span className="w-2 h-2 rounded-full bg-moss"></span>
                    <span className="text-moss">{prevYear} Final:</span>
                    <span className="font-mono font-medium">${finalPrev.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                    <span className="text-walnut font-medium">Pace (vs STLY):</span>
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
    const currentYear = getYear(referenceDate);
    const prevYear = currentYear - 1;

    const chartData = useMemo(() => {
        const stlyDate = subYears(referenceDate, 1);

        // Initialize monthly data
        const monthlyData = MONTHS.map(month => ({
            month,
            revenueCurrentOTB: 0,
            revenuePrevSTLY: 0,
            revenuePrevFinal: 0
        }));

        data.forEach(res => {
            const checkInYear = getYear(res.checkInDate);
            const monthIndex = getMonth(res.checkInDate);
            const bookingDate = startOfDay(res.reservationDate);
            const revenue = res.revenue;

            // Current Year OTB: Checkin in current year AND Booking <= Reference Date
            if (checkInYear === currentYear) {
                if (isBefore(bookingDate, referenceDate) || isSameDay(bookingDate, referenceDate)) {
                    monthlyData[monthIndex].revenueCurrentOTB += revenue;
                }
            }

            // Previous Year STLY: Checkin in prev year AND Booking <= (Reference Date - 1 Year)
            if (checkInYear === prevYear) {
                if (isBefore(bookingDate, stlyDate) || isSameDay(bookingDate, stlyDate)) {
                    monthlyData[monthIndex].revenuePrevSTLY += revenue;
                }
                // Previous Year Final: Checkin in prev year (No booking date filter)
                monthlyData[monthIndex].revenuePrevFinal += revenue;
            }
        });

        return monthlyData;
    }, [data, referenceDate, currentYear, prevYear]);

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
                        tick={{ fill: '#5D6D59', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#5D6D59', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}
                        tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip currentYear={currentYear} prevYear={prevYear} />} cursor={{ fill: 'transparent' }} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-moss text-sm font-medium ml-1">{value}</span>}
                    />
                    <Bar
                        dataKey="revenueCurrentOTB"
                        name={`${currentYear} OTB`}
                        fill={COLOR_OTB_2026}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                    <Bar
                        dataKey="revenuePrevSTLY"
                        name={`${prevYear} STLY`}
                        fill={COLOR_STLY_2025}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                    <Line
                        type="monotone"
                        dataKey="revenuePrevFinal"
                        name={`${prevYear} Final`}
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
