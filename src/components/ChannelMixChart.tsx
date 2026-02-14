import { Doughnut } from 'react-chartjs-2';
import type { ChannelMix } from '../types';
import type { ChartOptions } from 'chart.js';

interface ChannelMixChartProps {
    data: ChannelMix[];
}

export const ChannelMixChart: React.FC<ChannelMixChartProps> = ({ data }) => {
    // Sort by revenue desc
    const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

    const chartData = {
        labels: sortedData.map(d => d.channel),
        datasets: [
            {
                data: sortedData.map(d => d.revenue),
                backgroundColor: [
                    '#13342D', // cedar
                    '#5D6D59', // moss
                    '#76574C', // walnut
                    '#DDDAD3', // bone
                    '#3F261F', // tobacco
                ],
                borderWidth: 0,
            }
        ]
    };

    const options: ChartOptions<'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: { family: 'Helvetica', size: 11 },
                    color: '#5D6D59'
                }
            },
            tooltip: {
                backgroundColor: '#161910',
                titleFont: { family: 'Cormorant Garamond', size: 14 },
                bodyFont: { family: 'Helvetica', size: 12 },
                callbacks: {
                    label: (context: any) => {
                        const val = context.parsed;
                        const total = context.chart._metasets[context.datasetIndex].total;
                        const pct = ((val / total) * 100).toFixed(1) + '%';
                        return ` ${context.label}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)} (${pct})`;
                    }
                }
            }
        },
        cutout: '60%'
    };

    return (
        <div className="w-full h-[300px]">
            <Doughnut data={chartData} options={options} />
        </div>
    );
};
