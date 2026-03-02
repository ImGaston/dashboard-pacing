"use client";

import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
    ResponsiveContainer
} from 'recharts';
import { getMonth, getYear, differenceInDays, startOfDay } from 'date-fns';
import type { Reservation } from '@/types';

interface BookingCurveChartProps {
    data: Reservation[];
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const COLOR_2026 = "#13342D"; // Cedar
const COLOR_2025 = "#76574C"; // Walnut

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-bone-light p-3 border border-bone-dark shadow-[0_4px_12px_rgba(22,25,16,0.08)] rounded-lg text-xs">
                <p className="font-bold text-onyx mb-2">{label} Days Out</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
                        <span className="font-medium">{entry.name}:</span>
                        <span className="font-mono font-bold">${Number(entry.value).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export const BookingCurveChart: React.FC<BookingCurveChartProps> = ({ data }) => {
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

    const currentDaysOut = useMemo(() => {
        const targetYear = 2026;
        const firstDayOfMonth = new Date(targetYear, selectedMonth, 1);
        const today = new Date();

        return differenceInDays(firstDayOfMonth, today);
    }, [selectedMonth]);

    const chartData = useMemo(() => {
        // 1. Filter data for the selected month
        const filteredData = data.filter(res => getMonth(res.checkInDate) === selectedMonth);

        // 2. Pre-calculate lead times and revenues
        const reservations2025 = filteredData.filter(r => getYear(r.checkInDate) === 2025).map(r => ({
            revenue: r.revenue,
            leadTime: differenceInDays(startOfDay(r.checkInDate), startOfDay(r.reservationDate))
        }));

        const reservations2026 = filteredData.filter(r => getYear(r.checkInDate) === 2026).map(r => ({
            revenue: r.revenue,
            leadTime: differenceInDays(startOfDay(r.checkInDate), startOfDay(r.reservationDate))
        }));

        // 3. Generate curve points from 365 down to 0
        const points = [];
        for (let daysOut = 365; daysOut >= 0; daysOut--) {
            const rev2025 = reservations2025.reduce((sum, r) => r.leadTime >= daysOut ? sum + r.revenue : sum, 0);
            const rev2026 = reservations2026.reduce((sum, r) => r.leadTime >= daysOut ? sum + r.revenue : sum, 0);

            points.push({
                daysOut,
                cumulative2025: rev2025,
                cumulative2026: rev2026
            });
        }

        return points;
    }, [data, selectedMonth]);

    return (
        <div className="w-full">
            <div className="flex justify-end mb-4">
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-bone-light border border-bone-dark text-tobacco text-sm rounded-[12px] focus:ring-cedar/30 focus:border-cedar block p-2.5"
                >
                    {MONTHS.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                    ))}
                </select>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis
                            dataKey="daysOut"
                            type="number"
                            domain={[0, 365]}
                            reversed={true}
                            tickCount={8}
                            label={{ value: "Days Before Check-in", position: "insideBottom", offset: -5, fontSize: 12, fill: '#5D6D59' }}
                            tick={{ fill: '#5D6D59', fontSize: 12 }}
                        />
                        <YAxis
                            tickFormatter={(value) => `$${value / 1000}k`}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#5D6D59', fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} />
                        {currentDaysOut >= 0 && currentDaysOut <= 365 && (
                            <ReferenceLine
                                x={currentDaysOut}
                                stroke="#8B3A3A"
                                strokeDasharray="3 3"
                                label={{ value: "TODAY", position: "top", fill: "#8B3A3A", fontSize: 12, fontWeight: "bold" }}
                            />
                        )}
                        <Line
                            type="monotone"
                            dataKey="cumulative2026"
                            name={`2026 (Forward)`}
                            stroke={COLOR_2026}
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="cumulative2025"
                            name={`2025 (Reference)`}
                            stroke={COLOR_2025}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
