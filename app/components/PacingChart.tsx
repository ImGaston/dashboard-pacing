"use client";

import React from 'react';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { PacingDataPoint } from '@/types';
import '@/utils/chartSetup';

interface PacingChartProps {
    data: PacingDataPoint[];
    currentYear: number;
    prevYear: number;
}

export const PacingChart: React.FC<PacingChartProps> = ({ data, currentYear, prevYear }) => {
    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: `${currentYear}`,
                data: data.map(d => d.cumulative2026),
                borderColor: '#13342D', // cedar
                backgroundColor: 'rgba(19, 52, 45, 0.05)',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                fill: true,
            },
            {
                label: `${prevYear}`,
                data: data.map(d => d.cumulative2025),
                borderColor: '#76574C', // walnut
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                fill: false,
            }
        ]
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 12,
                        family: 'Helvetica'
                    },
                    color: '#5D6D59'
                }
            },
            tooltip: {
                backgroundColor: '#161910',
                titleFont: { family: 'Cormorant Garamond', size: 14 },
                bodyFont: { family: 'Helvetica', size: 12 },
                padding: 10,
                cornerRadius: 4,
                displayColors: true,
                callbacks: {
                    label: (context: any) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        family: 'Helvetica',
                        size: 11
                    },
                    color: '#5D6D59'
                }
            },
            y: {
                grid: {
                    color: '#e5e5e5',
                    tickLength: 0
                },
                border: {
                    display: false
                },
                ticks: {
                    callback: (value: any) => {
                        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
                    },
                    font: {
                        family: 'Helvetica',
                        size: 11
                    },
                    color: '#5D6D59',
                    padding: 10
                }
            }
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    };

    return (
        <div className="w-full h-[400px]">
            <Line data={chartData} options={options} />
        </div>
    );
};
