import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { LeadTimeBucket } from '../types';
import type { ChartOptions } from 'chart.js';

interface LeadTimeHistogramProps {
    data: LeadTimeBucket[];
    currentYear: number;
    prevYear: number;
}

export const LeadTimeHistogram: React.FC<LeadTimeHistogramProps> = ({ data, currentYear, prevYear }) => {
    const chartData = {
        labels: data.map(d => d.range),
        datasets: [
            {
                label: `${currentYear}`,
                data: data.map(d => d.count2026),
                backgroundColor: '#13342D',
                borderRadius: 4,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            },
            {
                label: `${prevYear}`,
                data: data.map(d => d.count2025),
                backgroundColor: '#76574C',
                borderRadius: 4,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            }
        ]
    };

    const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: '#161910',
                titleFont: { family: 'Cormorant Garamond', size: 14 },
                bodyFont: { family: 'Helvetica', size: 12 },
                padding: 10,
                cornerRadius: 4,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#5D6D59', font: { family: 'Helvetica' } }
            },
            y: {
                grid: { color: '#e5e5e5' },
                border: { display: false },
                ticks: { color: '#5D6D59', font: { family: 'Helvetica' } }
            }
        }
    };

    return (
        <div className="w-full h-[300px]">
            <Bar data={chartData} options={options} />
        </div>
    );
};
